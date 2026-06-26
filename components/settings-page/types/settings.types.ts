export interface ProviderStatus {
  name: string
  displayName: string
  configured: boolean
  health: 'Healthy' | 'Warning' | 'Unavailable'
  stats: {
    totalRequests: number
    successRate: number
    avgLatencyMs: number
    failures: number
  }
}

export interface DiagnosticChecks {
  permission: { status: 'pass' | 'fail' | 'warn'; message: string } | null
  sw: { status: 'pass' | 'fail'; message: string } | null
  firebase: { status: 'pass' | 'fail'; message: string } | null
  token: { status: 'pass' | 'fail'; message: string } | null
  dbRegistration: { status: 'pass' | 'fail'; message: string } | null
  preferences: { status: 'pass' | 'warn' | 'fail'; message: string } | null
}
