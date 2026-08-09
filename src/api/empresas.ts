import { apiClient } from './client'
import type { EmpresasListResponse } from '@/types/api'

export interface EmpresasQuery {
  page?: number
  limit?: number
  search?: string
  status?: string
  subscriptionStatus?: string
}

export function listEmpresas(query: EmpresasQuery = {}): Promise<EmpresasListResponse> {
  return apiClient.get<EmpresasListResponse>('/empresas', {
    params: {
      page: query.page,
      limit: query.limit ?? 15,
      search: query.search,
      status: query.status === 'all' ? undefined : query.status,
      subscriptionStatus: query.subscriptionStatus === 'all' ? undefined : query.subscriptionStatus,
    },
  })
}
