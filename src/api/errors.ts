export class ApiError extends Error {
  statusCode: number
  messages: string[]

  constructor(statusCode: number, messages: string[]) {
    super(messages.join(' '))
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.messages = messages
  }
}

export function normalizeError(statusCode: number, body: unknown): ApiError {
  const message = (body as { message?: string | string[] } | null)?.message
  const messages = Array.isArray(message) ? message : [message ?? `Erro HTTP ${statusCode}`]
  return new ApiError(statusCode, messages)
}
