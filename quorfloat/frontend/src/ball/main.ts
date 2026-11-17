import { invoke } from '@tauri-apps/api/core'
import './styles.css'

const element = document.getElementById('ball')
if (!(element instanceof HTMLButtonElement)) throw new Error('#ball is missing from the document')
const button: HTMLButtonElement = element
const logoElement = button.querySelector('img')
if (!(logoElement instanceof HTMLImageElement)) throw new Error('the ball logo is missing')
const image: HTMLImageElement = logoElement
const officialLogo = image.src

type BallSettings = {
  floatingBall: boolean
  ballLogo: string
}

declare global {
  interface Window {
    __quorfloatBallSettings?: (settings: BallSettings) => void
  }
}

let snapshotVersion = 0
let currentLogo = ''
let objectUrl: string | null = null
let reportedVisible: boolean | undefined
let reportedLogo: string | undefined
button.hidden = true

function reportError(error: unknown): void {
  console.error('quorfloat ball command failed', error)
  void invoke('log', { line: `frontend ball error: ${String(error).slice(0, 160)}` }).catch(() => {})
}

function customLogoUrl(dataUrl: string): string {
  const separator = dataUrl.indexOf(',')
  const mime = dataUrl.slice('data:'.length, separator).replace(/;base64$/, '')
  const encoded = dataUrl.slice(separator + 1)
  const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
  return URL.createObjectURL(new Blob([bytes], { type: mime }))
}

function applySettings(settings: BallSettings): void {
  button.hidden = !settings.floatingBall
  const logo = settings.ballLogo
  if (reportedVisible !== settings.floatingBall || reportedLogo !== logo) {
    reportedVisible = settings.floatingBall
    reportedLogo = logo
    void invoke('log', {
      line: `frontend ball settings: visible=${settings.floatingBall} customLogo=${logo !== ''}`,
    }).catch(reportError)
  }
  if (logo === currentLogo) return
  currentLogo = logo
  if (objectUrl !== null) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
  try {
    objectUrl = logo === '' ? null : customLogoUrl(logo)
    image.src = objectUrl ?? officialLogo
  } catch (error) {
    currentLogo = ''
    image.src = officialLogo
    reportError(error)
  }
}

image.addEventListener('error', () => {
  if (image.src !== officialLogo) image.src = officialLogo
})

window.__quorfloatBallSettings = settings => {
  snapshotVersion += 1
  applySettings(settings)
}

void invoke<BallSettings>('get_ball_settings').then(settings => {
  // A snapshot that arrived while the command was in flight is newer.
  if (snapshotVersion === 0) applySettings(settings)
}).catch(reportError)

button.addEventListener('click', () => {
  void invoke('summon_panel').catch(reportError)
})
