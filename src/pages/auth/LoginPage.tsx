import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { ApiError } from '@/api/errors'

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
})

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; senha?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const result = loginSchema.safeParse({ email, senha })
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      setFieldErrors({ email: errors.email?.[0], senha: errors.senha?.[0] })
      return
    }
    setFieldErrors({})
    setSubmitting(true)

    try {
      await login(result.data)
      // loadSession populates user; re-read after login via getMe is done in login()
      // Limited SDR goes to /sdr; full admin to dashboard.
      const dest =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(dest && dest !== '/login' ? dest : '/dashboard', { replace: true })
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.messages.join(' ')
          : 'Não foi possível entrar. Tente novamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-md rounded-xl border border-teal-border bg-sidebar-bg p-8 shadow-[0_0_40px_rgba(20,184,166,0.12)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-main text-sm font-bold text-app-bg">
            SA
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main">Unna Superadmin</h1>
            <p className="text-xs text-text-muted">Acesso restrito à equipe Unna</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            id="email"
            label="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <Input
            id="senha"
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={fieldErrors.senha}
          />

          {formError && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-text-faint">
          Storage isolado · não compartilha sessão com o painel do cliente
        </p>
      </div>
    </div>
  )
}
