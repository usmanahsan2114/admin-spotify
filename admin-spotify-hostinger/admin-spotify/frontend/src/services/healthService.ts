import { apiFetch } from './apiClient'

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  uptime: number
  environment: string
  database: {
    status: 'connected' | 'disconnected'
    latency: number
    error?: string | null
  }
  performance: {
    apiLatency: number
    memory: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
    }
  }
  version: string
}

export const fetchHealthStatus = async (): Promise<HealthStatus> => {
  return apiFetch<HealthStatus>('/api/health', {
    method: 'GET',
    skipAuth: true, // Health endpoint is public, no auth required
  })
}

