import { apiClient } from './client'
import type { AuthResponse, LoginPayload, User } from '@/types/api'

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', payload, { auth: false })
}

export function getMe(): Promise<User> {
  return apiClient.get<User>('/auth/me')
}
