import { apiClient } from './client'
import type { DashboardStats } from '@/types/api'

export function getDashboardStats(): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>('/super-admin/dashboard-stats')
}

export function suspenderEmpresa(id: string): Promise<unknown> {
  return apiClient.patch(`/super-admin/empresas/${id}/suspender`)
}

export function reativarEmpresa(id: string): Promise<unknown> {
  return apiClient.patch(`/super-admin/empresas/${id}/reativar`)
}

export function purgeEmpresa(id: string): Promise<unknown> {
  return apiClient.delete(`/super-admin/empresas/${id}/purge`)
}
