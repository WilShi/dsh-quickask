// The D layout's bottom composer: the growing input plus screenshot and permission actions.
// The textarea remains uncontrolled so host snapshots never fight the caret.

import { useLayoutEffect, useState, type RefObject } from 'react'
import { useT } from '../../hooks/useI18n'
import type { ImageDraft, Snapshot } from '../../logic/state'
import { ImageAttachmentPreview } from './ImageAttachmentPreview'
import { Icon } from '../common/Icon'
import { PermissionPicker } from '../chrome/PermissionPicker'

/** Props for {@link Composer}. */
export interface ComposerProps {
  readonly state: Snapshot
  readonly inputRef: RefObject<HTMLTextAreaElement | null>
  readonly busy: boolean
  readonly hasEntries: boolean
  readonly draft: string
  readonly openMenu: string | null
  readonly onToggleMenu: (id: string) => void
  readonly onCloseMenu: () => void
  readonly onDraft: (text: string) => void
  readonly onSend: () => void
  readonly onGrow: () => void
  readonly onAddImage: () => void
  readonly onImage: (file: File) => void
  readonly onOpenSettings: () => void
  readonly image: ImageDraft | null
  readonly onRemoveImage: () => void
}

/** Render the bottom input card and its real action controls. */
export function Composer({
  state, inputRef, busy, hasEntries, draft, openMenu, onToggleMenu, onCloseMenu,
  onDraft, onSend, onGrow, onAddImage, onOpenSettings, image, onRemoveImage, onImage,
}: ComposerProps) {
  const t = useT()
  const base = 34
  const cap = 120
  const [dragActive, setDragActive] = useState(false)
  const acceptFile = (file: File | null | undefined): void => {
    if (file != null) onImage(file)
  }

  const resize = (): void => {
    const input = inputRef.current
    if (input === null) return
    input.style.height = `${base}px`
    input.style.height = `${Math.min(input.scrollHeight || base, cap)}px`
    input.style.overflowY = input.scrollHeight > cap ? 'auto' : 'hidden'
  }

  useLayoutEffect(() => {
    const input = inputRef.current
    if (input === null) return
    if (document.activeElement !== input) input.value = draft
    resize()
  })

  return (
    <div
      className={dragActive ? 'q-compose q-image-dragging' : 'q-compose'}
      onDragEnter={event => {
        event.preventDefault()
        if (event.dataTransfer.types.includes('Files')) setDragActive(true)
      }}
      onDragOver={event => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={() => { setDragActive(false) }}
      onDrop={event => {
        event.preventDefault()
        setDragActive(false)
        acceptFile(event.dataTransfer.files[0])
      }}
      onPaste={event => {
        const item = Array.from(event.clipboardData.items).find(entry => entry.type.startsWith('image/'))
        if (item === undefined) return
        event.preventDefault()
        acceptFile(item.getAsFile())
      }}
    >
      {image !== null && <ImageAttachmentPreview image={image} onRemove={onRemoveImage} />}
      <span className="q-search" id="q-search-icon"><Icon name="search" /></span>
      <textarea
        id="q-input"
        ref={inputRef}
        rows={1}
        aria-label={t('composer.inputLabel')}
        placeholder={hasEntries ? t('composer.placeholderFollowUp') : t('composer.placeholderAsk')}
        onInput={event => {
          onDraft(event.currentTarget.value)
          resize()
          onGrow()
        }}
      />
      <button
        type="button"
        id="q-send"
        className="q-submit"
        aria-label={busy ? t('composer.stop') : t('composer.send')}
        onClick={onSend}
      >
        <Icon name={busy ? 'square' : 'arrow-up'} />
      </button>
      <div className="q-compose-actions">
        <button type="button" className="q-compose-action" onClick={onAddImage}>
          <span className="q-action-glyph" aria-hidden="true">▣</span>
          {t('action.addImage')}
        </button>
        <button type="button" className="q-compose-action" onClick={onOpenSettings}>
          {t('action.more')}
          <Icon name="chevron-down" />
        </button>
        <PermissionPicker
          state={state}
          open={openMenu === 'q-permission'}
          onToggle={() => { onToggleMenu('q-permission') }}
          onClose={onCloseMenu}
        />
      </div>
    </div>
  )
}
