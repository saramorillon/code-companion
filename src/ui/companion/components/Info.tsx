import { CompanionViewState } from '../../../types.js'
import { KindRarity, formatTokensCompact } from '../../shared.js'

export function Info({ state }: { state: CompanionViewState | null }) {
  const name = state?.speciesName ?? ''
  const index = state?.stageIndex ?? 0
  const total = state?.totalStages ?? 0

  const usedAtStage = state?.usedAtStage ?? 0
  const threshold = state?.stageThreshold ?? 0
  const ratio = threshold > 0 ? Math.min(1, usedAtStage / threshold) : 0
  const remaining = Math.max(0, threshold - usedAtStage)
  const isFinalStage = index >= total - 1

  return (
    <div id="info">
      <div id="name-row">
        <span id="name">{name}</span>
        <span id="kind-rarity">{state && <KindRarity kind={state.kind} color={state.color} />}</span>
      </div>
      <div id="stage-text">
        Stage {index + 1} / {total}
      </div>
      <div id="progress-bar">
        <div id="progress-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
      <div id="remaining-text">
        {remaining > 0 ? `${formatTokensCompact(remaining)} to ${isFinalStage ? 'harvest' : 'next stage'}` : ''}
      </div>
    </div>
  )
}
