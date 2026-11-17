// The D layout's context row: workspace, conversation, and the full model/effort.

import type { Scope } from '../../logic/scope'
import type { Snapshot } from '../../logic/state'
import { ModelPicker } from './ModelPicker'
import { SessionPicker } from './SessionPicker'
import { WorkspacePicker } from './WorkspacePicker'

/** Props for {@link ContextBar}. */
export interface ContextBarProps {
  readonly state: Snapshot
  readonly targetWorkspace: string | null
  readonly scope: Scope | null
  readonly openMenu: string | null
  readonly onToggleMenu: (id: string) => void
  readonly onCloseMenu: () => void
  readonly onChooseWorkspace: (workspaceId: string) => void
  readonly onChooseUngrouped: () => void
  readonly onSelectSession: (sessionId: string) => void
}

/** Show the current conversation context without hiding the model behind an icon. */
export function ContextBar({
  state, targetWorkspace, scope, openMenu, onToggleMenu, onCloseMenu,
  onChooseWorkspace, onChooseUngrouped, onSelectSession,
}: ContextBarProps) {
  return (
    <div className="q-contexts">
      <div className="q-context">
        <WorkspacePicker
          state={state}
          targetWorkspace={targetWorkspace}
          scope={scope}
          open={openMenu === 'q-workspace'}
          onToggle={() => { onToggleMenu('q-workspace') }}
          onClose={onCloseMenu}
          onChoose={onChooseWorkspace}
          onChooseUngrouped={onChooseUngrouped}
        />
        <span className="q-divider" aria-hidden="true">/</span>
        <SessionPicker
          state={state}
          scope={scope}
          onSelect={onSelectSession}
          open={openMenu === 'q-session'}
          onToggle={() => { onToggleMenu('q-session') }}
          onClose={onCloseMenu}
        />
      </div>
      <ModelPicker
        state={state}
        open={openMenu === 'q-config'}
        onToggle={() => { onToggleMenu('q-config') }}
        onClose={onCloseMenu}
      />
    </div>
  )
}
