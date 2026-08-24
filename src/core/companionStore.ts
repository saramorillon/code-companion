import {
  CompanionState,
  PlantingState,
  HarvestEntry,
  DayUsage,
  BestDay,
  WEEK_HISTORY_DAYS,
  plantingStageThreshold,
  freshDailyStats,
  todayLocalDate,
} from './companionModel.js'
import { GardenAtlas, drawPlanting, findSpecies } from './gardenAtlas.js'

// Tire une nouvelle plantation (espèce + couleur), synchrone et purement locale via l'atlas.
export function newPlanting(atlas: GardenAtlas): PlantingState {
  const draw = drawPlanting(atlas)
  const species = findSpecies(atlas, draw.kind, draw.speciesId)!
  return {
    speciesId: draw.speciesId,
    kind: draw.kind,
    color: draw.color,
    stageIndex: 0,
    totalStages: species.stages[draw.color].length,
    usedAtStage: 0,
  }
}

export interface ApplyUsageResult {
  state: CompanionState
  justGrew: boolean
  justHarvested: boolean
}

// Applique un delta de tokens à la plantation active : accumule dans l'étape courante, puis fait
// grandir (en reportant le surplus) ou récolte au stade final, en boucle si le delta est énorme.
// Une récolte tire immédiatement une nouvelle plantation et lui sème le surplus, pouvant cascader
// sur plusieurs récoltes complètes en un seul appel si le delta est très grand.
export function applyUsageToPlanting(state: CompanionState, delta: number, atlas: GardenAtlas): ApplyUsageResult {
  if (!state.active) return { state, justGrew: false, justHarvested: false }

  let planting = { ...state.active, usedAtStage: state.active.usedAtStage + delta }
  let justGrew = false
  let justHarvested = false
  let harvests = state.harvests
  let harvestedCount = state.harvestedCount

  const maxIterations = 50 // garde-fou contre une boucle infinie si un seuil valait 0
  for (let i = 0; i < maxIterations; i++) {
    const threshold = plantingStageThreshold(planting.kind, planting.color, planting.totalStages, planting.stageIndex)
    if (planting.usedAtStage < threshold) break

    const overflow = planting.usedAtStage - threshold
    const isFinalStage = planting.stageIndex >= planting.totalStages - 1

    if (isFinalStage) {
      const entry: HarvestEntry = {
        speciesId: planting.speciesId,
        kind: planting.kind,
        color: planting.color,
        harvestedAt: new Date().toISOString(),
      }
      harvests = [...harvests, entry]
      harvestedCount++
      justHarvested = true

      planting = { ...newPlanting(atlas), usedAtStage: overflow }
      justGrew = true
      continue
    }

    planting = { ...planting, stageIndex: planting.stageIndex + 1, usedAtStage: overflow }
    justGrew = true
  }

  return {
    state: { ...state, active: planting, harvests, harvestedCount },
    justGrew,
    justHarvested,
  }
}

export function seedInstallBaseline(state: CompanionState, now: Date): CompanionState {
  return { ...state, installBaselineAt: now.toISOString() }
}

// Accumule tokens/caractères du jour, en repartant de zéro si la date locale a changé depuis
// la dernière mise à jour (reset à minuit heure locale, pas de minuteur dédié nécessaire).
export function addToDailyStats(state: CompanionState, now: Date, tokens: number, chars: number): CompanionState {
  const date = todayLocalDate(now)
  const today = state.today.date === date ? state.today : freshDailyStats(date)
  return {
    ...state,
    today: { date, tokens: today.tokens + tokens, chars: today.chars + chars },
  }
}

// aiTokens/typedTokens sont déjà en équivalent-tokens (voir TYPED_CHAR_TOKEN_EQUIVALENT) : on
// les garde cumulés séparément pour pouvoir calculer le ratio IA vs frappe manuelle.
export function addToUsageSplit(state: CompanionState, aiTokens: number, typedTokens: number): CompanionState {
  return {
    ...state,
    aiTokensSinceInstall: state.aiTokensSinceInstall + aiTokens,
    typedTokensSinceInstall: state.typedTokensSinceInstall + typedTokens,
  }
}

// Accumule dans l'entrée du jour de weekHistory (créée si absente), puis élague les entrées
// plus vieilles que la fenêtre glissante pour garder le tableau persisté borné dans le temps.
export function addToWeekHistory(
  state: CompanionState,
  now: Date,
  aiTokens: number,
  typedTokens: number,
): CompanionState {
  const date = todayLocalDate(now)
  const oldestKeptDate = todayLocalDate(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WEEK_HISTORY_DAYS - 1)),
  )

  const pruned = state.weekHistory.filter((day) => day.date >= oldestKeptDate && day.date !== date)
  const existing = state.weekHistory.find((day) => day.date === date)
  const updated: DayUsage = {
    date,
    aiTokens: (existing?.aiTokens ?? 0) + aiTokens,
    typedTokens: (existing?.typedTokens ?? 0) + typedTokens,
  }

  return { ...state, weekHistory: [...pruned, updated] }
}

// Compare le jour donné (identifié par sa date) au record actuel sur le total combiné
// (aiTokens + typedTokens) et remplace le record si ce jour fait mieux, y compris le jour en
// cours (le record doit pouvoir être battu avant la fin de la journée, pas seulement le lendemain).
export function updateBestDay(state: CompanionState, day: DayUsage): CompanionState {
  const dayTotal = day.aiTokens + day.typedTokens
  const bestTotal = state.bestDay ? state.bestDay.aiTokens + state.bestDay.typedTokens : -1
  if (dayTotal <= bestTotal) return state

  const bestDay: BestDay = { date: day.date, aiTokens: day.aiTokens, typedTokens: day.typedTokens }
  return { ...state, bestDay }
}
