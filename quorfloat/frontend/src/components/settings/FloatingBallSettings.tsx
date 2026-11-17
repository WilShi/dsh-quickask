// Floating-ball visibility and custom logo preferences.
// Images stay below 512 KiB so the snapshot remains well below the 1 MiB frame limit.

import { useRef, useState } from 'react'
import { api } from '../../api'
import officialMark from '../../assets/deepseek-official.png'
import { useT } from '../../hooks/useI18n'
import type { Snapshot } from '../../logic/state'

/** Props for {@link FloatingBallSettings}. */
export interface FloatingBallSettingsProps {
  /** Current shell snapshot, including the optional ball preferences. */
  readonly state: Snapshot
}

/** Render the enable switch, circular preview, file picker, and official-logo reset. */
export function FloatingBallSettings({ state }: FloatingBallSettingsProps) {
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const enabled = state.settings.floatingBall === true
  const logo = state.settings.ballLogo || officialMark

  const choose = (file: File | undefined): void => {
    if (file === undefined) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError(t('settings.ballLogoType'))
      return
    }
    if (file.size > 512 * 1024) {
      setError(t('settings.ballLogoTooLarge'))
      return
    }
    setBusy(true)
    setError(null)
    const reader = new FileReader()
    reader.onerror = () => {
      setBusy(false)
      setError(t('settings.ballLogoFailed'))
    }
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setBusy(false)
        setError(t('settings.ballLogoFailed'))
        return
      }
      void api.setPreferences({ ballLogo: reader.result })
        .catch(() => { setError(t('settings.ballLogoFailed')) })
        .finally(() => { setBusy(false) })
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="q-setting">
        <div>
          <span>{t('settings.floatingBall')}</span>
          <small>{t('settings.floatingBallDetail')}</small>
        </div>
        <button
          type="button"
          id="q-ball-toggle"
          className="q-switch"
          role="switch"
          aria-checked={enabled}
          aria-label={t('settings.floatingBall')}
          onClick={() => { void api.setPreferences({ floatingBall: !enabled }) }}
        >
          <span className="q-knob" />
        </button>
      </div>
      <div className="q-setting">
        <div>
          <span>{t('settings.ballLogo')}</span>
          <small>{t('settings.ballLogoDetail')}</small>
          {error !== null && <small className="q-ball-error" role="alert">{error}</small>}
        </div>
        <div className="q-ball-controls">
          <img className="q-ball-logo-preview" src={logo} alt={t('settings.ballLogoAlt')} />
          <div className="q-ball-buttons">
            <button type="button" disabled={busy} onClick={() => { fileRef.current?.click() }}>
              {t('settings.ballLogoChoose')}
            </button>
            <button type="button" disabled={busy} onClick={() => { void api.setPreferences({ ballLogo: '' }) }}>
              {t('settings.ballLogoReset')}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={event => {
              choose(event.currentTarget.files?.[0])
              event.currentTarget.value = ''
            }}
          />
        </div>
      </div>
    </>
  )
}
