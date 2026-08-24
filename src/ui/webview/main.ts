import { formatTokensCompact, renderKindAndRarity } from '../shared.js'

type GardenKind = 'tree' | 'crop'
type GardenColor = 'normal' | 'silver' | 'gold'

interface AtlasRect {
  x: number
  y: number
  width: number
  height: number
}

interface CompanionViewState {
  speciesId: string | null
  speciesName: string | null
  kind: GardenKind | null
  color: GardenColor | null
  stageIndex: number | null
  totalStages: number | null
  usedAtStage: number
  stageThreshold: number | null
  usedSinceInstall: number
  aiTokensSinceInstall: number
  typedTokensSinceInstall: number
}

interface StateMessage {
  type: 'state'
  state: CompanionViewState
  tilesetUri: string
  rect: AtlasRect | null
}

const spriteOuterEl = document.getElementById('sprite-outer')!
const spriteEl = document.getElementById('sprite')!
const nameEl = document.getElementById('name')!
const kindRarityEl = document.getElementById('kind-rarity')!
const stageTextEl = document.getElementById('stage-text')!
const progressFill = document.getElementById('progress-fill') as HTMLElement
const remainingTextEl = document.getElementById('remaining-text')!

// Le tileset natif est petit (32-64px) : agrandi à l'affichage pour rester lisible dans la
// sidebar, via transform plutôt que background-size (évite d'avoir besoin des dimensions
// totales du PNG, seul le rect de la tuile courante suffit).
const SCALE = 2

window.addEventListener('message', (event: MessageEvent<StateMessage>) => {
  const message = event.data
  if (message.type !== 'state') return
  render(message.state, message.tilesetUri, message.rect)
})

function render(state: CompanionViewState, tilesetUri: string, rect: AtlasRect | null): void {
  if (state.speciesId === null || !rect) {
    spriteOuterEl.style.width = '0px'
    spriteOuterEl.style.height = '0px'
    nameEl.textContent = ''
    kindRarityEl.innerHTML = ''
    stageTextEl.textContent = ''
    remainingTextEl.textContent = ''
    return
  }

  spriteOuterEl.style.width = `${rect.width * SCALE}px`
  spriteOuterEl.style.height = `${rect.height * SCALE}px`
  spriteEl.style.width = `${rect.width}px`
  spriteEl.style.height = `${rect.height}px`
  spriteEl.style.backgroundImage = `url(${tilesetUri})`
  spriteEl.style.backgroundPosition = `-${rect.x}px -${rect.y}px`
  spriteEl.style.transform = `scale(${SCALE})`

  nameEl.textContent = state.speciesName ?? ''
  renderKindAndRarity(kindRarityEl, state.kind, state.color)

  stageTextEl.textContent =
    state.stageIndex !== null && state.totalStages !== null ? `Stage ${state.stageIndex + 1} / ${state.totalStages}` : ''

  const threshold = state.stageThreshold ?? 0
  const ratio = threshold > 0 ? Math.min(1, state.usedAtStage / threshold) : 0
  progressFill.style.width = `${Math.round(ratio * 100)}%`

  const remaining = Math.max(0, threshold - state.usedAtStage)
  const isFinalStage = state.stageIndex !== null && state.totalStages !== null && state.stageIndex >= state.totalStages - 1
  remainingTextEl.textContent =
    remaining > 0 ? `${formatTokensCompact(remaining)} to ${isFinalStage ? 'harvest' : 'next stage'}` : ''
}
