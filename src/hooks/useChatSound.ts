import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'unna:chat:som'
const DEBOUNCE_MS = 1000
const DURACAO_BIPE_S = 0.12

let audioContext: AudioContext | null = null

function obterAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextCtor =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioContext) {
    audioContext = new AudioContextCtor()
  }
  return audioContext
}

/**
 * Bipe curto e discreto (~120ms) gerado na hora via Web Audio API — sem arquivo
 * de áudio no repo e sem URL externa (a CSP bloqueia). O AudioContext só é criado
 * aqui, depois de alguma interação do usuário na página; se o navegador ainda
 * estiver com autoplay bloqueado (`state === 'suspended'`), tenta retomar e, se
 * não conseguir, falha em silêncio.
 */
function tocarBipe() {
  const ctx = obterAudioContext()
  if (!ctx) return

  const disparar = () => {
    try {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 880
      const agora = ctx.currentTime
      // Envelope curto para não estalar: sobe rápido e desce antes de 120ms.
      gain.gain.setValueAtTime(0, agora)
      gain.gain.linearRampToValueAtTime(0.16, agora + 0.015)
      gain.gain.linearRampToValueAtTime(0, agora + DURACAO_BIPE_S)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(agora)
      oscillator.stop(agora + DURACAO_BIPE_S + 0.02)
    } catch {
      // Ambiente sem áudio disponível não deve quebrar o chat.
    }
  }

  if (ctx.state === 'suspended') {
    ctx.resume().then(disparar).catch(() => {})
  } else {
    disparar()
  }
}

function lerPreferenciaSalva(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(STORAGE_KEY) !== 'off'
}

/**
 * Hook de som do chat de atendimento: guarda a preferência (localStorage),
 * expõe como alternar e uma função `notificar` que toca o bipe respeitando um
 * debounce de 1 bipe por segundo (evita metralhar em rajada de mensagens).
 */
export function useChatSound() {
  const [somAtivo, setSomAtivo] = useState<boolean>(() => lerPreferenciaSalva())
  const ultimoBipeEmRef = useRef(0)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, somAtivo ? 'on' : 'off')
  }, [somAtivo])

  const alternarSom = useCallback(() => setSomAtivo((atual) => !atual), [])

  const notificar = useCallback(() => {
    if (!somAtivo) return
    const agora = Date.now()
    if (agora - ultimoBipeEmRef.current < DEBOUNCE_MS) return
    ultimoBipeEmRef.current = agora
    tocarBipe()
  }, [somAtivo])

  return { somAtivo, alternarSom, notificar }
}
