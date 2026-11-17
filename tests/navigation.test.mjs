// Main-window session navigation: request lifecycle and the browser's open/clear choice.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadModule, repoRoot } from './helpers.mjs'

test('a navigation request carries its session and is acknowledged once', async () => {
  const { resetNavigation, requestNavigation, pendingNavigation, acknowledgeNavigation } = await loadModule('host/navigation.js')
  resetNavigation()
  const first = requestNavigation({ sessionId: 'session-1', workspaceId: 'workspace-1' })
  assert.deepEqual(pendingNavigation(), { sessionId: 'session-1', workspaceId: 'workspace-1', nonce: first.nonce })
  acknowledgeNavigation(first.nonce)
  assert.equal(pendingNavigation(), null)
})

test('an empty navigation selects the empty-session view and an old ack cannot clear a newer request', async () => {
  const { resetNavigation, requestNavigation, pendingNavigation, acknowledgeNavigation } = await loadModule('host/navigation.js')
  resetNavigation()
  const first = requestNavigation({})
  const second = requestNavigation({ sessionId: 'session-2' })
  assert.equal(pendingNavigation().sessionId, 'session-2')
  acknowledgeNavigation(first.nonce)
  assert.equal(pendingNavigation().nonce, second.nonce)
  acknowledgeNavigation(second.nonce)
  assert.equal(pendingNavigation(), null)
})

test('the browser applies open for a session and clear for an empty navigation', async () => {
  let exported
  const previousWindow = globalThis.window
  globalThis.window = {
    __ModuleLoader__: {
      load: ({ factory }) => {
        exported = factory(() => ({ createElement: () => null }))
      },
    },
  }
  new Function('window', readFileSync(join(repoRoot, 'lib/client.js'), 'utf8'))(globalThis.window)
  globalThis.window = previousWindow
  const { applyNavigation } = exported
  const calls = []
  const uiWorkspace = {
    openSession: id => { calls.push(['open', id]) },
    startSession: workspaceId => { calls.push(['start', workspaceId]) },
  }
  applyNavigation(uiWorkspace, { sessionId: 'session-1', workspaceId: 'workspace-1' })
  applyNavigation(uiWorkspace, { sessionId: null, workspaceId: 'workspace-1' })
  assert.deepEqual(calls, [['open', 'session-1'], ['start', 'workspace-1']])
})
