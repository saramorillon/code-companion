import { Category, Rarity } from './types.js'

export const PROVIDERS = ['user', 'claude'] as const

export const RARITIES: Rarity[] = ['normal', 'silver', 'gold'] as const

export const STAGES = {
  'crop-normal': [20000000, 60000000, 120000000, 200000000, 300000000],
  'crop-silver': [40000000, 120000000, 240000000, 400000000, 600000000],
  'crop-gold': [60000000, 180000000, 360000000, 600000000, 900000000],
  'tree-normal': [75000000, 225000000, 450000000, 750000000],
  'tree-silver': [150000000, 450000000, 900000000, 1500000000],
  'tree-gold': [225000000, 675000000, 1350000000, 2250000000],
} as const

export const SPRITE_SCALE = 3

export const CATEGORY_ICONS: Record<Category, string> = {
  tree: '🌳',
  crop: '🌱',
}
