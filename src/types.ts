import { PROVIDERS } from './constants.js'

export type Provider = (typeof PROVIDERS)[number]

export type Category = 'tree' | 'crop'
export type Rarity = 'normal' | 'silver' | 'gold'
export type Rect = { x: number; y: number; width: number; height: number }

export interface Atlas {
  image: string
  tileSize: { width: number; height: number }
  species: [
    {
      id: string
      name: string
      category: Category
      stages: Record<Rarity, Rect>[]
      harvestIcon: Record<Rarity, Rect>
      basketIcon: Record<Rarity, Rect>
    },
  ]
}

export interface AppState {
  tokens: Record<string, number>
  active: {
    speciesId: string
    rarity: Rarity
    tokens: number
  }
  harvests: {
    speciesId: string
    rarity: Rarity
  }[]
  today: {
    date: string
    tokens: Record<string, number>
  }
  weekHistory: {
    date: string
    tokens: Record<string, number>
  }[]
  bestDay: {
    date: string
    tokens: Record<string, number>
  }
  fileOffsets: Record<string, number>
}
