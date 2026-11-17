// Model selection for the picker: defaults belong only to new-conversation state.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadModule } from './helpers.mjs'

const catalog = () => ({
  groups: [{
    id: 'ark',
    name: 'Ark',
    models: [{
      id: 'kimi-k3-1-pro-261024',
      name: 'Kimi K3.1 Pro',
      reasoning: {
        defaultEffort: 'max',
        efforts: [{ id: 'max', name: 'Max' }],
      },
    }],
  }],
})

function services(overrides = {}) {
  return {
    sessionController: {
      modelCatalog: async () => catalog(),
      projections: async () => ({
        values: {
          modelSelection: {
            next: { provider: 'deepseek', model: 'session-model', reasoningEffort: 'high' },
          },
        },
      }),
    },
    agentDefaultModel: {
      currentSelection: () => ({ provider: 'ark', model: 'kimi-k3-1-pro-261024', reasoningEffort: 'max' }),
    },
    permissionPresets: {
      catalog: () => ({ options: [{ value: 'workspace-write', name: 'Workspace Write', description: null }] }),
      current: () => 'workspace-write',
      set: () => {},
      defaultPreset: 'workspace-write',
    },
    ...overrides,
  }
}

test('an unattached new conversation reads the deployment default model', async () => {
  const { createHarnessFromContext } = await loadModule('harness/adapter.js')
  const { harness } = createHarnessFromContext(name => services()[name], { warn: () => {}, debug: () => {} })
  const options = await harness.options()
  assert.deepEqual(options.current, { provider: 'ark', model: 'kimi-k3-1-pro-261024', reasoningEffort: 'max' })
  assert.equal(options.groups[0].models[0].name, 'Kimi K3.1 Pro')
})

test('an existing session selection wins over the deployment default', async () => {
  const { createHarnessFromContext } = await loadModule('harness/adapter.js')
  const { harness } = createHarnessFromContext(name => services()[name], { warn: () => {}, debug: () => {} })
  const options = await harness.options('session-1')
  assert.deepEqual(options.current, { provider: 'deepseek', model: 'session-model', reasoningEffort: 'high' })
})

test('a missing default-model service leaves the new-conversation selection absent', async () => {
  const { createHarnessFromContext } = await loadModule('harness/adapter.js')
  const withoutDefault = services()
  delete withoutDefault.agentDefaultModel
  const { harness } = createHarnessFromContext(name => withoutDefault[name], { warn: () => {}, debug: () => {} })
  const options = await harness.options()
  assert.equal(options.current, undefined)
})

test('a new conversation also reads the default permission preset', async () => {
  const { createHarnessFromContext } = await loadModule('harness/adapter.js')
  const { harness } = createHarnessFromContext(name => services()[name], { warn: () => {}, debug: () => {} })
  const options = await harness.options()
  assert.equal(options.permission, 'workspace-write')
  assert.equal(options.permissions[0].name, '工作区内修改')
})

test('session permissions still win over the default preset', async () => {
  const { createHarnessFromContext } = await loadModule('harness/adapter.js')
  const custom = services()
  custom.sessionController.projections = async () => ({
    values: {
      modelSelection: { next: { provider: 'deepseek', model: 'session-model', reasoningEffort: 'high' } },
      permissions: { currentValue: 'danger-full-access' },
    },
  })
  const { harness } = createHarnessFromContext(name => custom[name], { warn: () => {}, debug: () => {} })
  const options = await harness.options('session-1')
  assert.equal(options.permission, 'danger-full-access')
})

test('a missing default preset leaves the new-conversation permission absent', async () => {
  const { createHarnessFromContext } = await loadModule('harness/adapter.js')
  const withoutDefault = services()
  delete withoutDefault.permissionPresets.defaultPreset
  const { harness } = createHarnessFromContext(name => withoutDefault[name], { warn: () => {}, debug: () => {} })
  const options = await harness.options()
  assert.equal(options.permission, undefined)
})

test('an invalid default-model answer is not projected as a real selection', async () => {
  const { readDefaultSelection } = await loadModule('harness/adapter.js')
  assert.equal(readDefaultSelection(() => undefined), undefined)
  assert.equal(readDefaultSelection(name => name === 'agentDefaultModel' ? { currentSelection: () => ({ provider: '', model: 'missing' }) } : undefined), undefined)
})
