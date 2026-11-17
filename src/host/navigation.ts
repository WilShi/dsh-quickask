// One pending main-window navigation, shared by the stdio request and the browser consumer.

import type { PluginContext } from '../cordis-types.js'
import { registerRemoteService } from './remote-gateway.js'

/** A session the browser should select, or null for the empty-session view. */
export interface NavigationRequest {
  readonly sessionId: string | null
  readonly workspaceId: string | null
  readonly nonce: number
}

let pending: NavigationRequest | null = null
let nextNonce = 0

/** Queue one navigation without replacing a newer request when it is acknowledged. */
export function requestNavigation(input: { sessionId?: string | null; workspaceId?: string | null }): { accepted: true; nonce: number } {
  nextNonce += 1
  pending = {
    sessionId: input.sessionId ?? null,
    workspaceId: input.workspaceId ?? null,
    nonce: nextNonce,
  }
  return { accepted: true, nonce: nextNonce }
}

/** Read the current request for the browser poller. */
export function pendingNavigation(): NavigationRequest | null {
  return pending
}

/** Clear only the request the browser actually consumed. */
export function acknowledgeNavigation(nonce: number): { accepted: true } {
  if (pending?.nonce === nonce) pending = null
  return { accepted: true }
}

/** Reset process-local state for focused tests. */
export function resetNavigation(): void {
  pending = null
  nextNonce = 0
}

/** Expose pending/acknowledge to the plugin's browser half. */
export function registerNavigationGateway({ ctx }: { ctx: PluginContext }): () => void {
  return registerRemoteService({
    ctx,
    serviceKey: 'quorfloat.navigation',
    namespace: 'quorfloat',
    methods: [
      { method: 'navigationPending', implementation: async () => pendingNavigation() },
      { method: 'navigationAcknowledge', implementation: async (nonce: number) => acknowledgeNavigation(nonce) },
    ],
  })
}
