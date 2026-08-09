# Superadmin — painel Unna

Painel **separado** do frontend do cliente (`front/` / `unnify-front/`).  
Entrega da **Fase B**: superfície própria, storage isolado, host/subdomínio dedicado.

## Por quê existe

Um token `SUPER_ADMIN` no mesmo `localStorage` e SPA do tenant eleva o risco de XSS e reuso de sessão. Este app:

- Roda em build/host próprio (porta dev `5175`)
- Usa chaves de storage `unna_sa_*` (não compartilha com o painel do cliente)
- Só aceita login com role `SUPER_ADMIN`
- Usa o design dark/teal anexado (`auxiliares/design/*`), com aliases de tokens para as telas portadas do legado

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- React Router 7
- lucide-react, recharts, sonner, dnd-kit, tip-tap (features portadas)

## Desenvolvimento

```bash
cd superadmin
cp .env.example .env
pnpm install
pnpm dev
```

- App: http://localhost:5175  
- API: `VITE_API_BASE_URL` (default `http://localhost:3090` — **sem** `/api`)  
- Cliente (impersonação): `VITE_CLIENT_APP_URL` (default `http://localhost:5173`)

## Rotas (paridade com `front/src/pages/superadmin`)

| Rota | Página |
|------|--------|
| `/login` | Login SUPER_ADMIN |
| `/dashboard` | Dashboard + gráficos + engajamento |
| `/empresas` | CRUD, purge, suspender, impersonar, detalhes, diagnóstico agenda, faturas |
| `/usuarios` | Gestão de usuários |
| `/clientes` | Clientes multi-empresa + perfil |
| `/afiliados` | Programa de afiliados |
| `/planos` | Planos SaaS |
| `/assinaturas` | Assinaturas |
| `/suporte` | Notificações em massa (WAHA) |
| `/campanhas` | Campanhas in-app |
| `/feature-management` | Kanban de features |
| `/webhooks` | Logs de webhook |
| `/monitoramento` | Worker + cron logs |
| `/marketing` | Templates + leads |
| `/atribuicao` | Relatório de ads |
| `/relatorios` | Relatórios |
| `/configuracoes` | Config sistema + canais oficiais |
| `/sdr` | Painel SDR (`is_limited`) |

Usuário com `is_limited=true` só acessa `/sdr`.

## Impersonação (cross-app)

Apps distintos → **não** compartilham `localStorage`.

1. Superadmin: `POST /super-admin/impersonate/:empresaId`
2. Abre o client:  
   `VITE_CLIENT_APP_URL/auth/impersonate#token=…&user=…&empresa=…`  
   (hash: JWT não cai em access log do servidor)
3. `front` em `/auth/impersonate` grava sessão tenant + flag `impersonation_source=external` e vai para `/admin`
4. Banner “Voltar ao Super Admin” limpa a sessão e redireciona para `VITE_SUPERADMIN_URL/empresas`

Env:

| App | Variável | Default dev |
|-----|----------|-------------|
| superadmin | `VITE_CLIENT_APP_URL` | `http://localhost:5173` |
| front | `VITE_SUPERADMIN_URL` | `http://localhost:5175` |

## Segurança (próximos passos)

- **Fase A** (backend): claim `scope`, `JWT_ADMIN_SECRET`, guards cruzados
- **Fase C**: 2FA SUPER_ADMIN, allowlist IP, auditoria

## Origem do código

Páginas e services foram portados de `front/src/pages/superadmin` e `front/src/services/*`, com shell/layout e tokens deste app.
