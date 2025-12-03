import type { LogLevel } from '@/shared/types'
import { config } from '@/shared/config'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel = LOG_LEVELS[config.logLevel]

const formatMessage = (level: string, message: string, data?: object): string => {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  return `${timestamp} [${level.toUpperCase()}] ${message}${dataStr}`
}

export const log = {
  debug: (message: string, data?: object): void => {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message, data))
    }
  },
  info: (message: string, data?: object): void => {
    if (currentLevel <= LOG_LEVELS.info) {
      console.info(formatMessage('info', message, data))
    }
  },
  warn: (message: string, data?: object): void => {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, data))
    }
  },
  error: (message: string, data?: object): void => {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, data))
    }
  },
}
