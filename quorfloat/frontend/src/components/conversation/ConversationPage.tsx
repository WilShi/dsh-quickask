// The D conversation page: transcript first, then the bottom composer.

import type { RefObject } from 'react'
import type { ImageDraft, Snapshot } from '../../logic/state'
import { isBusy } from '../../logic/view-text'
import { Cards } from '../cards/Cards'
import { Composer } from './Composer'
import { EmptyState } from './EmptyState'
import { Thread } from '../thread/Thread'

/** Props for {@link ConversationPage}. */
export interface ConversationPageProps {
  readonly state: Snapshot
  readonly hidden: boolean
  readonly openMenu: string | null
  readonly onToggleMenu: (id: string) => void
  readonly onCloseMenu: () => void
  readonly draft: string
  readonly onDraft: (text: string) => void
  readonly onSend: () => void
  readonly onGrow: () => void
  readonly inputRef: RefObject<HTMLTextAreaElement | null>
  readonly folds: ReadonlyMap<string, boolean>
  readonly onToggleFold: (key: string) => void
  readonly onAddImage: () => void
  readonly onImage: (file: File) => void
  readonly onOpenSettings: () => void
  readonly image: ImageDraft | null
  readonly onRemoveImage: () => void
}

/** Render the conversation with the D layout's fixed bottom input. */
export function ConversationPage({
  state, hidden, openMenu, onToggleMenu, onCloseMenu, draft, onDraft, onSend, onGrow, inputRef,
  folds, onToggleFold, onAddImage, onOpenSettings, onImage, image, onRemoveImage,
}: ConversationPageProps) {
  const showEmpty = !isBusy(state)
    && state.transcript.entries.length === 0
    && state.transcript.live === null
    && state.interactions.length === 0
  return (
    <div id="q-main" hidden={hidden}>
      <Cards state={state} onGrow={onGrow} />
      {showEmpty && <EmptyState />}
      <Thread state={state} folds={folds} onToggleFold={onToggleFold} />
      <Composer
        state={state}
        inputRef={inputRef}
        busy={isBusy(state)}
        hasEntries={state.transcript.entries.length > 0}
        draft={draft}
        openMenu={openMenu}
        onToggleMenu={onToggleMenu}
        onCloseMenu={onCloseMenu}
        onDraft={onDraft}
        onSend={onSend}
        onGrow={onGrow}
        onAddImage={onAddImage}
        onOpenSettings={onOpenSettings}
        onImage={onImage}
        image={image}
        onRemoveImage={onRemoveImage}
      />
    </div>
  )
}
