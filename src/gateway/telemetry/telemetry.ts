import { openTelemetrySetup } from '@graphql-hive/plugin-opentelemetry/setup'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { credentials } from '@grpc/grpc-js'
import { env } from '@/gateway/config'
import { log } from '@/shared/utils'

if (env.otlpUrl) {
  log.info(`[telemetry] Initializing OpenTelemetry with OTLP endpoint: ${env.otlpUrl}`)

  openTelemetrySetup({
    contextManager: new AsyncLocalStorageContextManager(),

    traces: {
      exporter: new OTLPTraceExporter({
        url: env.otlpUrl,
        credentials: credentials.createInsecure(),
      }),
    },

    resource: {
      serviceName: 'graphql-gateway',
      serviceVersion: '1.0.0',
    },
  })
} else {
  log.info('[telemetry] OTLP_URL not set, telemetry disabled')
}
