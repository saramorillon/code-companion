import { KIND_ICONS, KIND_LABELS } from '../constants.js'
import { GardenKind, GardenColor } from '../types.js'

export function formatTokensCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs < 1_000) return `${value}`
  if (abs < 1_000_000) return sign + trim(abs / 1_000, 1) + 'K'
  if (abs < 1_000_000_000) return sign + trim(abs / 1_000_000, 1) + 'M'
  return sign + trim(abs / 1_000_000_000, 2) + 'B'
}

function trim(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '')
}

// Rend "kind" en emoji + label texte, plus une étoile grise/dorée uniquement pour silver/gold
// (normal n'a pas d'étoile : la couleur normal était visuellement trop proche de silver en badge
// plein, l'étoile seule suffit à signaler la rareté sans avoir besoin d'une 3e couleur de badge).
export function KindRarity({ kind, color }: { kind: GardenKind | null; color: GardenColor | null }) {
  if (!kind) return null
  return (
    <>
      <span className="kind-icon">{KIND_ICONS[kind] ?? ''}</span>
      <span className="kind-label">{KIND_LABELS[kind] ?? ''}</span>
      {(color === 'silver' || color === 'gold') && <span className={`rarity-star ${color}`} />}
    </>
  )
}
