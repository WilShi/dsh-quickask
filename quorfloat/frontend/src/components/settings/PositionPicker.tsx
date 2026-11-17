// Panel position preference: keep the floating window away from the work below it.

import { api } from '../../api'
import { useT } from '../../hooks/useI18n'
import type { WindowAnchor } from '../../logic/state'
import { PickerPopover } from '../chrome/PickerPopover'
import { Icon } from '../common/Icon'
import { MenuHeading } from '../menus/MenuHeading'
import { MenuOption } from '../menus/MenuOption'

/** Props for {@link PositionPicker}. */
export interface PositionPickerProps {
  readonly anchor: WindowAnchor | undefined
  readonly open: boolean
  readonly onToggle: () => void
  readonly onClose: () => void
}

/** Render the position picker with top-center as the default. */
export function PositionPicker({ anchor, open, onToggle, onClose }: PositionPickerProps) {
  const t = useT()
  const current = anchor ?? 'center'
  const options: readonly WindowAnchor[] = ['top-center', 'center', 'top-left', 'top-right']
  const label = (value: WindowAnchor): string => {
    if (value === 'center') return t('position.center')
    if (value === 'top-left') return t('position.topLeft')
    if (value === 'top-right') return t('position.topRight')
    return t('position.topCenter')
  }
  return (
    <PickerPopover
      id="q-position"
      menuId="q-position-menu"
      label={t('settings.position')}
      menuLabel={t('settings.position')}
      menuClass="q-right"
      open={open}
      onToggle={onToggle}
      onClose={onClose}
      trigger={
        <>
          <span id="q-position-name">{label(current)}</span>
          <span id="q-position-chevron" className="q-chevron"><Icon name="chevron-down" /></span>
        </>
      }
    >
      <MenuHeading title={t('settings.position')} detail={t('settings.positionDetail')} />
      {options.map(value => (
        <MenuOption
          key={value}
          label={label(value)}
          selected={value === current}
          onPick={() => {
            void api.setPreferences({ anchor: value })
            onClose()
          }}
        />
      ))}
    </PickerPopover>
  )
}
