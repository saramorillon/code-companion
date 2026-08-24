import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { formatTokensCompact, GardenColor, GardenKind, KindRarity } from '../shared.js'

declare function acquireVsCodeApi(): { postMessage(message: unknown): void }
const vscode = acquireVsCodeApi()

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

// Le tileset natif est petit (32-64px) : agrandi à l'affichage pour rester lisible dans la
// sidebar, via transform plutôt que background-size (évite d'avoir besoin des dimensions
// totales du PNG, seul le rect de la tuile courante suffit).
const SCALE = 3

function App() {
  const [data, setData] = useState<{ state: CompanionViewState; tilesetUri: string; rect: AtlasRect | null } | null>(
    null,
  )

  useEffect(() => {
    const onMessage = (event: MessageEvent<StateMessage>) => {
      if (event.data.type !== 'state') return
      setData({ state: event.data.state, tilesetUri: event.data.tilesetUri, rect: event.data.rect })
    }
    window.addEventListener('message', onMessage)
    vscode.postMessage({ type: 'ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!data || data.state.speciesId === null || !data.rect) {
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

  const { state, tilesetUri, rect } = data

  const threshold = state.stageThreshold ?? 0
  const ratio = threshold > 0 ? Math.min(1, state.usedAtStage / threshold) : 0
  const remaining = Math.max(0, threshold - state.usedAtStage)
  const isFinalStage = state.stageIndex !== null && state.totalStages !== null && state.stageIndex >= state.totalStages - 1

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
          {state.stageIndex !== null && state.totalStages !== null ? `Stage ${state.stageIndex + 1} / ${state.totalStages}` : ''}
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

render(<App />, document.body)
