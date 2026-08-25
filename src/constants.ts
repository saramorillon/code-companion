import { GardenColor, GardenKind } from './types.js'

export const GARDEN_COLORS: readonly GardenColor[] = ['normal', 'silver', 'gold']

// Caractère tapé manuellement dans l'éditeur -> équivalent en tokens pour la progression du
// compagnon. Sans ce facteur, la frappe manuelle serait négligeable face au volume de tokens
// Claude Code (des centaines de millions par jour) : 1 caractère = 1 token ne se voit jamais.
export const TYPED_CHAR_TOKEN_EQUIVALENT = 500

export const HARVEST_BASE_TOTAL = 300_000_000

export const COLOR_MULTIPLIER: Record<GardenColor, number> = {
  normal: 1,
  silver: 2,
  gold: 4,
}

export const KIND_MULTIPLIER: Record<GardenKind, number> = {
  crop: 1,
  tree: 2.5,
}

export const WEEK_HISTORY_DAYS = 7

export const SPRITE_SCALE = 3

export const KIND_ICONS: Record<GardenKind, string> = { tree: '🌳', crop: '🌱' }
export const KIND_LABELS: Record<GardenKind, string> = { tree: 'Tree', crop: 'Crop' }

export const COUNT_ROWS: { kind: GardenKind; color: GardenColor }[] = [
  { kind: 'tree', color: 'normal' },
  { kind: 'tree', color: 'silver' },
  { kind: 'tree', color: 'gold' },
  { kind: 'crop', color: 'normal' },
  { kind: 'crop', color: 'silver' },
  { kind: 'crop', color: 'gold' },
]
