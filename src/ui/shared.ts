type GardenKind = 'tree' | 'crop'
type GardenColor = 'normal' | 'silver' | 'gold'

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

const KIND_ICONS: Record<GardenKind, string> = { tree: '🌳', crop: '🌱' }
const KIND_LABELS: Record<GardenKind, string> = { tree: 'Tree', crop: 'Crop' }

// Rend "kind" en emoji + label texte, plus une étoile grise/dorée uniquement pour silver/gold
// (normal n'a pas d'étoile : la couleur normal était visuellement trop proche de silver en badge
// plein, l'étoile seule suffit à signaler la rareté sans avoir besoin d'une 3e couleur de badge).
export function renderKindAndRarity(container: HTMLElement, kind: GardenKind | null, color: GardenColor | null): void {
  container.innerHTML = ''
  if (!kind) return

  const icon = document.createElement('span')
  icon.className = 'kind-icon'
  icon.textContent = KIND_ICONS[kind] ?? ''
  container.appendChild(icon)

  const label = document.createElement('span')
  label.className = 'kind-label'
  label.textContent = KIND_LABELS[kind] ?? ''
  container.appendChild(label)

  if (color === 'silver' || color === 'gold') {
    const star = document.createElement('span')
    star.className = `rarity-star ${color}`
    container.appendChild(star)
  }
}

