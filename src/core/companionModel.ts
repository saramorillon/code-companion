export type GardenKind = 'tree' | 'crop'
export type GardenColor = 'normal' | 'silver' | 'gold'

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

export function harvestTotal(kind: GardenKind, color: GardenColor): number {
  return HARVEST_BASE_TOTAL * COLOR_MULTIPLIER[color] * KIND_MULTIPLIER[kind]
}

// Répartit le total de récolte sur les étapes de croissance avec un coût croissant :
// l'étape i (sur k) coûte total * i / (1+2+...+k), donc chaque étape coûte plus que la précédente
// et la somme des k étapes reconstitue exactement le total.
export function plantingStageThreshold(
  kind: GardenKind,
  color: GardenColor,
  totalStages: number,
  stageIndex: number,
): number {
  const k = Math.max(1, totalStages)
  const i = stageIndex + 1
  const total = harvestTotal(kind, color)
  const triangularNumber = (k * (k + 1)) / 2
  return Math.round((total * i) / triangularNumber)
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

export function freshDailyStats(date: string): DailyStats {
  return { date, tokens: 0, chars: 0 }
}

export interface DayUsage {
  date: string // YYYY-MM-DD, heure locale
  aiTokens: number
  typedTokens: number
}

export const WEEK_HISTORY_DAYS = 7

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

export function freshCompanionState(): CompanionState {
  return {
    installBaselineAt: null,
    aiTokensSinceInstall: 0,
    typedTokensSinceInstall: 0,
    active: null,
    harvests: [],
    harvestedCount: 0,
    today: freshDailyStats(todayLocalDate(new Date())),
    weekHistory: [],
    bestDay: null,
  }
}

// Date locale au format YYYY-MM-DD (pas toISOString, qui est en UTC) pour que le reset des
// stats du jour se fasse à minuit heure locale de l'utilisateur, pas à minuit UTC.
export function todayLocalDate(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

// Fenêtre glissante des WEEK_HISTORY_DAYS derniers jours calendaires (aujourd'hui inclus),
// dans l'ordre chronologique, en comblant les jours sans usage avec des valeurs à zéro pour que
// le graphique en barres ait toujours WEEK_HISTORY_DAYS colonnes.
function lastWeekHistory(history: DayUsage[], now: Date): DayUsage[] {
  const byDate = new Map(history.map((day) => [day.date, day]))
  const days: DayUsage[] = []
  for (let offset = WEEK_HISTORY_DAYS - 1; offset >= 0; offset--) {
    const date = todayLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset))
    days.push(byDate.get(date) ?? { date, aiTokens: 0, typedTokens: 0 })
  }
  return days
}

export function computeStats(state: CompanionState, now: Date): CompanionStats {
  const counts: GardenCounts = {
    tree: { normal: 0, silver: 0, gold: 0 },
    crop: { normal: 0, silver: 0, gold: 0 },
  }
  for (const entry of state.harvests) {
    counts[entry.kind][entry.color]++
  }

  const isToday = state.today.date === todayLocalDate(now)

  return {
    harvestedCount: state.harvestedCount,
    counts,
    todayTokens: isToday ? state.today.tokens : 0,
    todayChars: isToday ? state.today.chars : 0,
    aiTokensSinceInstall: state.aiTokensSinceInstall,
    typedTokensSinceInstall: state.typedTokensSinceInstall,
    weekHistory: lastWeekHistory(state.weekHistory, now),
    bestDay: state.bestDay,
  }
}
