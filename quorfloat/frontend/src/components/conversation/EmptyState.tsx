// The quiet first-run state: it gives an empty conversation a visual centre
// without adding suggestions or fake content to the transcript.

import { useT } from '../../hooks/useI18n'
import { Icon } from '../common/Icon'

/**
 * Explain what submitting in the empty composer will do.
 *
 * @returns the empty-conversation guide.
 */
export function EmptyState() {
  const t = useT()
  return (
    <div className="q-empty">
      <span className="q-empty-mark" aria-hidden="true"><Icon name="message-square" /></span>
      <div className="q-empty-copy">
        <h2>{t('empty.title')}</h2>
        <p>{t('empty.detail')}</p>
      </div>
    </div>
  )
}
