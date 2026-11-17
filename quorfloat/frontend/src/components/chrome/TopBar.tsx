// The D layout's top bar: official DeepSeek mark and real window actions.

import officialMark from '../../assets/deepseek-official.png'
import { useT } from '../../hooks/useI18n'
import { keepOpenChecked } from '../../logic/settings'
import type { Scope } from '../../logic/scope'
import type { Snapshot } from '../../logic/state'
import { Icon } from '../common/Icon'
import { ContextBar } from './ContextBar'

/** Props for {@link TopBar}. */
export interface TopBarProps {
  readonly state: Snapshot
  readonly targetWorkspace: string | null
  readonly scope: Scope | null
  readonly openMenu: string | null
  readonly settingsOpen: boolean
  readonly onToggleMenu: (id: string) => void
  readonly onCloseMenu: () => void
  readonly onChooseWorkspace: (workspaceId: string) => void
  readonly onChooseUngrouped: () => void
  readonly onSelectSession: (sessionId: string) => void
  readonly onToggleSettings: () => void
  readonly onHide: () => void
  readonly onStartNew: () => void
  readonly onAddImage: () => void
  readonly onOpenMain: () => void
  readonly onToggleKeepOpen: () => void
}

/** Render official branding, actions, and the model/workspace context row. */
export function TopBar({
  state, targetWorkspace, scope, openMenu, settingsOpen, onToggleMenu, onCloseMenu,
  onChooseWorkspace, onChooseUngrouped, onSelectSession, onToggleSettings, onHide,
  onStartNew, onAddImage, onOpenMain, onToggleKeepOpen,
}: TopBarProps) {
  const t = useT()
  const keepOpen = keepOpenChecked(state.settings.hideOnBlur) === 'true'
  return (
    <div className="q-top">
      <div className="q-top-main" data-tauri-drag-region="deep">
        <span className="q-brand">
          <img className="q-brand-mark" src={officialMark} alt={t('brand.deepseek')} />
          <span>DeepSeek</span>
        </span>
        <div className="q-tools">
          <button type="button" className="q-close" aria-label={t('action.newSession')} onClick={onStartNew}>
            <Icon name="plus" />
          </button>
          <button type="button" className="q-close" aria-label={t('action.addImage')} onClick={onAddImage}>
            <span className="q-action-glyph" aria-hidden="true">▣</span>
          </button>
          <button type="button" className="q-close q-open-main" aria-label={t('action.openMain')} onClick={onOpenMain}>
            <Icon name="arrow-up" />
          </button>
          <button
            type="button"
            className="q-close"
            aria-label={t('settings.keepOpen')}
            aria-pressed={keepOpen}
            onClick={onToggleKeepOpen}
          >
            <Icon name={keepOpen ? 'pin' : 'pin-off'} />
          </button>
          <button
            id="q-settings-open"
            type="button"
            className="q-close"
            aria-label={t('settings.title')}
            aria-pressed={settingsOpen}
            onClick={onToggleSettings}
          >
            <Icon name="settings-2" />
          </button>
          <button id="q-close" type="button" className="q-close" aria-label={t('panel.hide')} onClick={onHide}>
            <Icon name="x" />
          </button>
        </div>
      </div>
      <ContextBar
        state={state}
        targetWorkspace={targetWorkspace}
        scope={scope}
        openMenu={openMenu}
        onToggleMenu={onToggleMenu}
        onCloseMenu={onCloseMenu}
        onChooseWorkspace={onChooseWorkspace}
        onChooseUngrouped={onChooseUngrouped}
        onSelectSession={onSelectSession}
      />
    </div>
  )
}
