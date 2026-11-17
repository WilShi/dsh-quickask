// Local image drafts: validate, read, and when necessary downscale for the prompt frame.

import type { ImageDraft } from './state'

const MAX_SOURCE_BYTES = 20 * 1024 * 1024
const MAX_ENCODED_BYTES = 768 * 1024
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp'])

export type ImageReadError = 'type' | 'size' | 'read'

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => { reject(new Error('read')) }
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('read'))
    }
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onerror = () => { reject(new Error('read')) }
    image.onload = () => { resolve(image) }
    image.src = dataUrl
  })
}

/** Read one local image into the draft used by the composer and prompt serializer. */
export async function readImageFile(file: File): Promise<ImageDraft> {
  if (!ALLOWED.has(file.type)) throw new Error('type' satisfies ImageReadError)
  if (file.size > MAX_SOURCE_BYTES) throw new Error('size' satisfies ImageReadError)
  const dataUrl = await readAsDataUrl(file)
  if (file.size <= MAX_ENCODED_BYTES) {
    return { mediaType: file.type as ImageDraft['mediaType'], data: dataUrl.slice(dataUrl.indexOf(',') + 1), name: file.name }
  }
  const source = await loadImage(dataUrl)
  for (const [width, quality] of [[1600, 0.85], [1200, 0.75], [900, 0.65], [700, 0.55]] as const) {
    const scale = Math.min(1, width / Math.max(source.naturalWidth, source.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(source.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(source.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (context === null) throw new Error('read' satisfies ImageReadError)
    context.drawImage(source, 0, 0, canvas.width, canvas.height)
    const compressed = canvas.toDataURL('image/jpeg', quality)
    if (compressed.length <= MAX_ENCODED_BYTES) {
      return { mediaType: 'image/jpeg', data: compressed.slice(compressed.indexOf(',') + 1), name: file.name }
    }
  }
  throw new Error('size' satisfies ImageReadError)
}
