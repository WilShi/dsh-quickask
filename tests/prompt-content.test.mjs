// Prompt content: legacy text compatibility and DSH image-part validation.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadModule } from './helpers.mjs'

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC'

test('text-only prompts keep the legacy content array', async () => {
  const { readPromptContent } = await loadModule('harness/adapter.js')
  assert.deepEqual(readPromptContent(undefined, 'hello'), [{ type: 'text', text: 'hello' }])
  assert.deepEqual(readPromptContent([], 'hello'), [{ type: 'text', text: 'hello' }])
})

test('the adapter forwards text and image parts to sessionController.prompt', async () => {
  const { createHarnessFromContext } = await loadModule('harness/adapter.js')
  const calls = []
  const services = {
    sessionController: {
      prompt: async request => { calls.push(request); return { accepted: true } },
    },
  }
  const { harness } = createHarnessFromContext(name => services[name], { warn: () => {}, debug: () => {} })
  await harness.prompt('session-1', 'request-1', 'look', [
    { type: 'text', text: 'look' },
    { type: 'image', mediaType: 'image/png', data: PNG, name: 'red.png' },
  ])
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].content, [
    { type: 'text', text: 'look' },
    { type: 'image', mediaType: 'image/png', data: PNG, name: 'red.png' },
  ])
  assert.equal(calls[0].content[1].path, undefined)
  assert.equal(calls[0].content[1].image_url, undefined)
  assert.equal(calls[0].content[1].attachment, undefined)
})

test('image data must be canonical base64 and a supported media type', async () => {
  const { readPromptContent } = await loadModule('harness/adapter.js')
  assert.throws(() => readPromptContent([{ type: 'image', mediaType: 'image/gif', data: 'not base64' }], 'x'), /canonical base64/)
  assert.throws(() => readPromptContent([{ type: 'image', mediaType: 'text/plain', data: PNG }], 'x'), /mediaType/)
})

test('oversized images are rejected before reaching the host', async () => {
  const { readPromptContent } = await loadModule('harness/adapter.js')
  const huge = Buffer.alloc(768 * 1024 + 1).toString('base64')
  assert.throws(() => readPromptContent([{ type: 'image', mediaType: 'image/png', data: huge }], 'x'), /768 KiB/)
})
