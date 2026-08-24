import { render } from 'preact'
import { formatTokensCompact, GardenColor, GardenKind, KindRarity } from '../shared.js'
import { WithMessage } from '../WithMessage.js'

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
  state: CompanionViewState
  tilesetUri: string
  rect: AtlasRect | null
}

const SCALE = 3

function App({ state, rect, tilesetUri }: StateMessage) {
  if (!state || state.speciesId === null || !rect) {
    return (
      <>
        <div id="sprite-container">
          <div id="sprite-outer" style={{ width: 0, height: 0 }}>
            <div id="sprite" />
          </div>
        </div>
        <div id="info">
          <div id="name-row">
            <span id="name" />
            <span id="kind-rarity" />
          </div>
          <div id="stage-text" />
          <div id="progress-bar">
            <div id="progress-fill" />
          </div>
          <div id="remaining-text" />
        </div>
      </>
    )
  }

  const threshold = state.stageThreshold ?? 0
  const ratio = threshold > 0 ? Math.min(1, state.usedAtStage / threshold) : 0
  const remaining = Math.max(0, threshold - state.usedAtStage)
  const isFinalStage =
    state.stageIndex !== null && state.totalStages !== null && state.stageIndex >= state.totalStages - 1

  return (
    <>
      <div id="sprite-container">
        <div id="sprite-outer" style={{ width: `${rect.width * SCALE}px`, height: `${rect.height * SCALE}px` }}>
          <div
            id="sprite"
            style={{
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundImage: `url(${tilesetUri})`,
              backgroundPosition: `-${rect.x}px -${rect.y}px`,
              transform: `scale(${SCALE})`,
            }}
          />
        </div>
      </div>
      <div id="info">
        <div id="name-row">
          <span id="name">{state.speciesName ?? ''}</span>
          <span id="kind-rarity">
            <KindRarity kind={state.kind} color={state.color} />
          </span>
        </div>
        <div id="stage-text">
          {state.stageIndex !== null && state.totalStages !== null
            ? `Stage ${state.stageIndex + 1} / ${state.totalStages}`
            : ''}
        </div>
        <div id="progress-bar">
          <div id="progress-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
        </div>
        <div id="remaining-text">
          {remaining > 0 ? `${formatTokensCompact(remaining)} to ${isFinalStage ? 'harvest' : 'next stage'}` : ''}
        </div>
      </div>
    </>
  )
}

render(<WithMessage view={App} />, document.body)
