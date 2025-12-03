import type { LogLevel } from '@/shared/types'

export const config = {
  logLevel: (process.env.LOGGING || 'info') as LogLevel,
}
