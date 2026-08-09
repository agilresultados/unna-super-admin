export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO'

export interface User {
  id: string
  email: string
  nome: string
  role: Role
  empresaId: string | null
  email_verificado?: boolean
  is_limited?: boolean
  createdAt?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface LoginPayload {
  email: string
  senha: string
}

export interface DashboardStats {
  totalEmpresas: number
  totalUsuarios: number
  totalAssinaturas: number
  receitaMensal: number
  receitaAnual: number
  assinaturasAtivas: number
  assinaturasTrial: number
  assinaturasCanceladas: number
  empresasEsteMes: number
  usuariosEsteMes: number
  usuariosOnline: number
  version: string
}

export interface Empresa {
  id: string
  nome_negocio: string
  email?: string | null
  telefone?: string | null
  cnpj?: string | null
  status: string
  slug?: string | null
  createdAt: string
  registered_at?: string
  assinatura?: {
    status?: string
    plano?: { nome?: string } | null
  } | null
}

export interface EmpresasListResponse {
  data: Empresa[]
  total: number
  page: number
  pages: number
  limit?: number
}
