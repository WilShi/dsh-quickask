// A captured image waiting in the composer: visible pixels, not a file path.

import { useEffect, useState } from 'react'
import { useT } from '../../hooks/useI18n'
import type { ImageDraft } from '../../logic/state'
import { Icon } from '../common/Icon'

/** Props for {@link ImageAttachmentPreview}. */
export interface ImageAttachmentPreviewProps {
  readonly image: ImageDraft
  readonly onRemove: () => void
}

/** Render a thumbnail, its label, and a real remove button. */
export function ImageAttachmentPreview({ image, onRemove }: ImageAttachmentPreviewProps) {
  const t = useT()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    try {
      const bytes = Uint8Array.from(atob(image.data), character => character.charCodeAt(0))
      objectUrl = URL.createObjectURL(new Blob([bytes], { type: image.mediaType }))
      setPreviewUrl(objectUrl)
    } catch {
      setPreviewUrl(null)
    }
    return () => {
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl)
    }
  }, [image])

  return (
    <div className="q-image-draft">
      <img className="q-image-draft-thumb" src={previewUrl ?? undefined} alt={t('composer.imageAlt')} />
      <div className="q-image-draft-copy">
        <strong>{t('composer.imageAttachment')}</strong>
        <span>{image.name}</span>
      </div>
      <button type="button" className="q-image-draft-remove" aria-label={t('composer.removeImage')} onClick={onRemove}>
        <Icon name="x" />
      </button>
    </div>
  )
}
