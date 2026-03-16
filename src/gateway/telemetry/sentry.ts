import * as Sentry from '@sentry/node'
import { env } from '@/gateway/config'
import { log } from '@/shared/utils'

/**
 * Initialize Sentry for error reporting and performance monitoring.
 *
 * Must be called after OpenTelemetry is set up (telemetry.ts) so that
 * skipOpenTelemetrySetup can hook into the already-registered providers
 * rather than creating a duplicate TracerProvider.
 */
export function initSentry(): void {
  if (!env.sentryDsn) {
    log.info('[sentry] SENTRY_DSN not set, Sentry disabled')
    return
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.sentryEnv,
    release: env.version,
    tracesSampleRate: 1.0,
    // OTEL is already configured via telemetry.ts — tell Sentry to hook into
    // the existing providers instead of registering its own.
    skipOpenTelemetrySetup: true,
  })

  log.info('[sentry] Initialized', { environment: env.sentryEnv, release: env.version })
}
