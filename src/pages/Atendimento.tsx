import { useCallback, useEffect, useState } from 'react'
import {
  Chat,
  ChatHeader,
  ConversationList,
  ConversationPreviewUI,
  MessageInput,
  MessageList,
  UIKitProvider,
} from '@tencentcloud/chat-uikit-react'
import { LoginStatus, useLoginState } from 'tuikit-atomicx-react'
import { Volume2, VolumeX } from 'lucide-react'
import {
  getAgentCredentials,
  getChatContatos,
  type TencentChatContato,
  type TencentChatCredentials,
} from '@/services/tencent-chat.service'
import { useChatSound } from '@/hooks/useChatSound'
import { EMOJI_BASE_URL, EMOJI_KEY_REGEX, EMOJI_URL_MAP } from './atendimento-emoji'
import './Atendimento.css'

/**
 * O inbox só conhece o conversationID (C2C + userId do Chat). Quem é o dono
 * daquele userId vem do backend. Cache no módulo porque a lista remonta a cada
 * mensagem nova e não faz sentido repetir a consulta.
 */
const contatoCache = new Map<string, TencentChatContato | null>()
const contatoInFlight = new Map<string, Promise<TencentChatContato | null>>()

function carregarContato(tencentUserId: string): Promise<TencentChatContato | null> {
  const emCache = contatoInFlight.get(tencentUserId)
  if (emCache) return emCache

  const promise = getChatContatos([tencentUserId])
    .then((contatos) => {
      const contato = contatos.find((item) => item.tencentUserId === tencentUserId) || null
      contatoCache.set(tencentUserId, contato)
      return contato
    })
    .catch(() => null)
    .finally(() => {
      contatoInFlight.delete(tencentUserId)
    })

  contatoInFlight.set(tencentUserId, promise)
  return promise
}

function useContato(tencentUserId: string) {
  const [contato, setContato] = useState<TencentChatContato | null>(
    () => contatoCache.get(tencentUserId) || null,
  )

  useEffect(() => {
    if (!tencentUserId) return
    if (contatoCache.has(tencentUserId)) {
      setContato(contatoCache.get(tencentUserId) || null)
      return
    }
    let cancelado = false
    carregarContato(tencentUserId).then((resultado) => {
      if (!cancelado) setContato(resultado)
    })
    return () => {
      cancelado = true
    }
  }, [tencentUserId])

  return contato
}

function CopiavelChip({ label, valor }: { label: string; valor: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = useCallback(
    (event: React.MouseEvent) => {
      // Sem isto o clique também troca a conversa selecionada.
      event.stopPropagation()
      event.preventDefault()
      navigator.clipboard
        ?.writeText(valor)
        .then(() => {
          setCopiado(true)
          window.setTimeout(() => setCopiado(false), 1200)
        })
        .catch(() => {})
    },
    [valor],
  )

  return (
    <button className="unna-atendimento-chip" onClick={copiar} title={`Copiar ${label}: ${valor}`} type="button">
      <span className="unna-atendimento-chip-label">{label}</span>
      <span className="unna-atendimento-chip-valor">{copiado ? 'copiado!' : valor}</span>
    </button>
  )
}

/**
 * A prévia da conversa é texto puro, então o código do emoji vira "[BareTeeth]".
 * Aqui trocamos o código pelo mesmo desenho que a conversa exibe.
 */
function PreviaComEmoji({ texto }: { texto: string }) {
  const partes = texto.split(EMOJI_KEY_REGEX).filter(Boolean)

  return (
    <span className="unna-atendimento-previa">
      {partes.map((parte, index) => {
        const arquivo = EMOJI_URL_MAP[parte]
        if (!arquivo) return <span key={index}>{parte}</span>
        return (
          <img
            key={index}
            alt={parte}
            className="unna-atendimento-previa-emoji"
            src={`${EMOJI_BASE_URL}${arquivo}`}
          />
        )
      })}
    </span>
  )
}

function ContatoPreview(props: React.ComponentProps<typeof ConversationPreviewUI>) {
  const conversationID = String(props.conversation?.conversationID || '')
  const tencentUserId = conversationID.startsWith('C2C') ? conversationID.slice(3) : ''
  const contato = useContato(tencentUserId)

  const titulo = (
    <div className="unna-atendimento-titulo">
      <div className="unna-atendimento-nome">{contato?.usuarioNome || props.Title}</div>
      {contato?.empresaNome && <div className="unna-atendimento-empresa">{contato.empresaNome}</div>}
    </div>
  )

  // Só assumimos a prévia quando é texto com emoji; o resto (rascunho, imagem,
  // mensagem apagada) continua com a formatação da biblioteca.
  const textoBruto = String(
    (props.conversation?.lastMessage as { messagePayload?: { text?: string } } | undefined)
      ?.messagePayload?.text || '',
  )
  const temEmoji = textoBruto.includes('[TUIEmoji_') && !props.conversation?.draft

  return (
    <ConversationPreviewUI
      {...props}
      Title={titulo}
      {...(temEmoji ? { LastMessageAbstract: <PreviaComEmoji texto={textoBruto} /> } : {})}
    />
  )
}

/** Barra de identificação da conversa aberta: onde os IDs cabem sem espremer a lista. */
function ContatoBar({ tencentUserId }: { tencentUserId: string }) {
  const contato = useContato(tencentUserId)

  return (
    <div className="unna-atendimento-barra">
      <div className="unna-atendimento-barra-nome">
        {contato?.empresaNome || contato?.usuarioNome || 'Cliente'}
      </div>
      <div className="unna-atendimento-ids">
        {contato?.empresaId && <CopiavelChip label="empresa" valor={contato.empresaId} />}
        <CopiavelChip label="usuário" valor={contato?.usuarioId || tencentUserId} />
      </div>
    </div>
  )
}

function AgentInbox({
  credentials,
  notificar,
}: {
  credentials: TencentChatCredentials
  notificar: () => void
}) {
  const [selecionada, setSelecionada] = useState('')
  const { status, client } = useLoginState({
    SDKAppID: Number(credentials.sdkAppId),
    userID: String(credentials.userId),
    userSig: String(credentials.userSig),
  })

  // Bipe de notificação: só para mensagem recebida (flow "in") de outra pessoa,
  // nunca para o que o próprio agente enviou. "onMessageReceived" é o evento do
  // SDK cru do Tencent Chat, acessível em client.chat (confirmado em
  // @tencentcloud/lite-chat/index.d.ts:2438 e usado internamente pelo
  // tuikit-atomicx-react em dist/index-DenOfma9.mjs).
  useEffect(() => {
    const chatSdk = client?.chat
    if (status !== LoginStatus.SUCCESS || !chatSdk) return

    const aoReceberMensagem = (event: { data?: Array<{ flow?: string; from?: string }> }) => {
      const deTerceiro = (event?.data || []).some(
        (mensagem) => mensagem.flow === 'in' && mensagem.from !== credentials.userId,
      )
      if (deTerceiro) notificar()
    }

    chatSdk.on('onMessageReceived', aoReceberMensagem)
    return () => {
      chatSdk.off('onMessageReceived', aoReceberMensagem)
    }
  }, [status, client, credentials.userId, notificar])

  if (status === LoginStatus.ERROR) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-semibold">Não foi possível entrar no inbox</p>
        <p className="text-sm text-text-muted">Confira SDKAppID e TENCENT_IM_SECRET_KEY. Detalhe no console (F12).</p>
      </div>
    )
  }

  if (status !== LoginStatus.SUCCESS) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
        <p className="text-sm">Entrando no atendimento...</p>
      </div>
    )
  }

  return (
    <div className="unna-atendimento-app unna-atendimento-agent">
      <ConversationList
        enableCreate={false}
        enableSearch
        PlaceholderEmptyList={
          <div className="unna-atendimento-empty">
            <div className="unna-atendimento-empty-title">Nenhum cliente escreveu ainda</div>
            <div className="unna-atendimento-empty-sub">
              Quando alguém abrir o Suporte no app Unna, a conversa aparece aqui.
            </div>
          </div>
        }
        Preview={ContatoPreview}
        onSelectConversation={(conversation) => setSelecionada(String(conversation?.conversationID || ''))}
        filter={(list) => list.filter((item) => String(item.conversationID || '').startsWith('C2C'))}
        style={{ flex: '0 0 300px', minWidth: 240, maxWidth: 360 }}
      />
      <Chat
        className="unna-atendimento-chat"
        PlaceholderEmpty={
          <div className="unna-atendimento-empty">
            <div className="unna-atendimento-empty-title">Nenhuma conversa selecionada</div>
            <div className="unna-atendimento-empty-sub">Escolha um cliente na lista para responder.</div>
          </div>
        }
      >
        <ChatHeader chatHeaderActions={[]} enableCall={false} />
        {selecionada.startsWith('C2C') && <ContatoBar tencentUserId={selecionada.slice(3)} />}
        <MessageList />
        <MessageInput />
      </Chat>
    </div>
  )
}

export default function Atendimento() {
  const [credentials, setCredentials] = useState<TencentChatCredentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { somAtivo, alternarSom, notificar } = useChatSound()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getAgentCredentials()
        if (cancelled) return
        setCredentials(data)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Erro ao obter credenciais do chat')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const body = (() => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-muted">
          Preparando inbox...
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="font-semibold">Falha ao carregar o atendimento</p>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      )
    }

    if (!credentials?.configured || !credentials.sdkAppId || !credentials.userId || !credentials.userSig) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <h2 className="text-lg font-bold">Chat sem chave do aplicativo</h2>
          <p className="max-w-md text-sm text-text-muted">
            Defina TENCENT_IM_SDK_APP_ID e TENCENT_IM_SECRET_KEY no backend. A conta do time é{' '}
            {credentials?.supportUserId || 'unna_suporte'}.
          </p>
        </div>
      )
    }

    return (
      <UIKitProvider language="en-US" theme="light">
        <AgentInbox credentials={credentials} notificar={notificar} />
      </UIKitProvider>
    )
  })()

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Atendimento</h1>
          <p className="text-sm text-text-muted">Conversas abertas pelos clientes no app. Sem criar grupo ou sala.</p>
        </div>
        <button
          type="button"
          onClick={alternarSom}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition hover:bg-surface-hover"
          title={somAtivo ? 'Desativar som de novas mensagens' : 'Ativar som de novas mensagens'}
        >
          {somAtivo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span className="hidden sm:inline">{somAtivo ? 'Som ligado' : 'Som desligado'}</span>
        </button>
      </div>
      <div className="unna-atendimento min-h-0 flex-1">{body}</div>
    </div>
  )
}
