import { config as sharedConfig } from '@/shared/config'

/**
 * Environment configuration for the gateway.
 * All values can be overridden via environment variables.
 */
export const env = {
  /** Port for the gateway (default: 4000) */
  port: Number(process.env.PORT) || 4000,

  /** Log level for the gateway */
  logLevel: sharedConfig.logLevel,

  /** Path to the KUBECONFIG file (required) */
  kubeconfigPath: process.env.KUBECONFIG || '',

  /** Polling interval for supergraph composition in milliseconds (default: 120000) */
  pollingInterval: Number(process.env.POLLING_INTERVAL) || 120_000,
}
