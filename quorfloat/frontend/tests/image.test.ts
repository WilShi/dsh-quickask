// Local image admission: type, size, and the unprefixed Base64 draft.

import { describe, expect, test } from 'vitest'
import { readImageFile } from '../src/logic/image'

describe('readImageFile', () => {
  test('reads a small local image without changing its bytes', async () => {
    const file = new File(['abc'], 'tiny.png', { type: 'image/png' })
    const draft = await readImageFile(file)
    expect(draft.mediaType).toBe('image/png')
    expect(draft.name).toBe('tiny.png')
    expect(draft.data).toBe('YWJj')
  })

  test('rejects unsupported file types', async () => {
    const file = new File(['plain text'], 'note.txt', { type: 'text/plain' })
    await expect(readImageFile(file)).rejects.toThrow('type')
  })

  test('rejects sources above the safety limit before reading them', async () => {
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' })
    await expect(readImageFile(file)).rejects.toThrow('size')
  })
})
