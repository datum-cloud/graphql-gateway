// Dev-only bootstrap. Registers the tsx loader inside the worker thread so the
// `.ts` entry can be loaded. In production the worker is built to `.js` and
// this bootstrap is unused.
import { register } from 'tsx/esm/api'

register()
await import('./compose-worker.ts')
