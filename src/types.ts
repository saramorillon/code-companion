export type GardenKind = 'tree' | 'crop'
export type GardenColor = 'normal' | 'silver' | 'gold'

export interface AtlasRect {
  x: number
  y: number
  width: number
  height: number
}

export interface BasketViewModel {
  speciesId: string
  speciesName: string
  kind: GardenKind
  color: GardenColor
  count: number
  rect: AtlasRect | null
}

export interface BasketsMessage {
  baskets: BasketViewModel[]
  tilesetUri: string
}

export interface GardenCounts {
  tree: Record<GardenColor, number>
  crop: Record<GardenColor, number>
}

export interface CompanionStats {
  harvestedCount: number
  counts: GardenCounts
  todayTokens: number
  todayChars: number
  aiTokensSinceInstall: number
  typedTokensSinceInstall: number
  weekHistory: DayUsage[]
  bestDay: BestDay | null
}

export interface CompanionViewState {
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

export interface StateMessage {
  state: CompanionViewState
  tilesetUri: string
  rect: AtlasRect | null
}

export interface PlantingState {
  speciesId: string
  kind: GardenKind
  color: GardenColor
  stageIndex: number
  totalStages: number
  usedAtStage: number
}

export interface HarvestEntry {
  speciesId: string
  kind: GardenKind
  color: GardenColor
  harvestedAt: string
}

export interface DailyStats {
  date: string // YYYY-MM-DD, heure locale
  tokens: number
  chars: number
}

export interface DayUsage {
  date: string // YYYY-MM-DD, heure locale
  aiTokens: number
  typedTokens: number
}

export interface BestDay {
  date: string // YYYY-MM-DD, heure locale
  aiTokens: number
  typedTokens: number
}

export interface CompanionState {
  installBaselineAt: string | null
  aiTokensSinceInstall: number
  typedTokensSinceInstall: number
  active: PlantingState | null
  harvests: HarvestEntry[]
  harvestedCount: number
  today: DailyStats
  weekHistory: DayUsage[]
  bestDay: BestDay | null
}
