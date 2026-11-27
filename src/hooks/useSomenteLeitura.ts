import { useAuth } from '@/contexts/AuthContext'

/**
 * Perfil de consulta (sócio): telas abertas, mas sem nenhuma ação.
 * O backend recusa qualquer escrita desse perfil; esconder os botões é só para
 * não oferecer o que vai dar 403.
 */
export function useSomenteLeitura(): boolean {
  return useAuth().user?.somente_leitura === true
}
