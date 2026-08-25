import { assert, test } from 'vitest'
import { freshCompanionState, plantingStageThreshold, todayLocalDate } from '../src/core/companionModel.js'
import {
  newPlanting,
  applyUsageToPlanting,
  addToDailyStats,
  addToUsageSplit,
  addToWeekHistory,
  updateBestDay,
} from '../src/core/companionStore.js'
import { GardenAtlas } from '../src/core/gardenAtlas.js'
import { PlantingState } from '../src/types.js'

function testAtlas(): GardenAtlas {
  const rect = { x: 0, y: 0, width: 32, height: 32 }
  return {
    image: 'tileset.png',
    tileSize: { width: 16, height: 16 },
    species: [
      {
        id: 'apple',
        name: 'Apple tree',
        kind: 'tree',
        stages: {
          normal: [rect, rect, rect, rect],
          silver: [rect, rect, rect, rect],
          gold: [rect, rect, rect, rect],
        },
        harvestIcon: { normal: rect, silver: rect, gold: rect },
        basketIcon: { normal: rect, silver: rect, gold: rect },
      },
      {
        id: 'corn',
        name: 'Corn',
        kind: 'crop',
        stages: {
          normal: [rect, rect, rect],
          silver: [rect, rect, rect],
          gold: [rect, rect, rect],
        },
        harvestIcon: { normal: rect, silver: rect, gold: rect },
        basketIcon: { normal: rect, silver: rect, gold: rect },
      },
    ],
  }
}

function plantingState(overrides: Partial<PlantingState> = {}): PlantingState {
  return {
    speciesId: 'corn',
    kind: 'crop',
    color: 'normal',
    stageIndex: 0,
    totalStages: 3,
    usedAtStage: 0,
    ...overrides,
  }
}

test('newPlanting draws a fresh planting at stage 0 with a valid totalStages', () => {
  const atlas = testAtlas()
  const planting = newPlanting(atlas)

  assert.equal(planting.stageIndex, 0)
  assert.equal(planting.usedAtStage, 0)
  assert.ok(planting.totalStages === 3 || planting.totalStages === 4)
})

test('applyUsageToPlanting accumulates without crossing the threshold', () => {
  const atlas = testAtlas()
  const state = { ...freshCompanionState(), active: plantingState() }
  const threshold = plantingStageThreshold('crop', 'normal', 3, 0)
  const result = applyUsageToPlanting(state, threshold - 1, atlas)

  assert.equal(result.justGrew, false)
  assert.equal(result.state.active?.stageIndex, 0)
  assert.equal(result.state.active?.usedAtStage, threshold - 1)
})

test('applyUsageToPlanting advances exactly at the threshold and carries no overflow', () => {
  const atlas = testAtlas()
  const state = { ...freshCompanionState(), active: plantingState() }
  const threshold = plantingStageThreshold('crop', 'normal', 3, 0)
  const result = applyUsageToPlanting(state, threshold, atlas)

  assert.equal(result.justGrew, true)
  assert.equal(result.state.active?.stageIndex, 1)
  assert.equal(result.state.active?.usedAtStage, 0)
})

test('applyUsageToPlanting carries overflow into the next stage', () => {
  const atlas = testAtlas()
  const state = { ...freshCompanionState(), active: plantingState() }
  const threshold = plantingStageThreshold('crop', 'normal', 3, 0)
  const result = applyUsageToPlanting(state, threshold + 100, atlas)

  assert.equal(result.state.active?.stageIndex, 1)
  assert.equal(result.state.active?.usedAtStage, 100)
})

test('applyUsageToPlanting cascades through multiple stages in one call', () => {
  const atlas = testAtlas()
  const state = { ...freshCompanionState(), active: plantingState() }
  const total = 300_000_000 // harvestTotal('crop', 'normal')
  const result = applyUsageToPlanting(state, total, atlas)

  assert.equal(result.justHarvested, true)
  assert.equal(result.state.harvests.length, 1)
  assert.equal(result.state.harvests[0]?.speciesId, 'corn')
  assert.equal(result.state.harvests[0]?.kind, 'crop')
  assert.equal(result.state.harvests[0]?.color, 'normal')
  assert.equal(result.state.harvestedCount, 1)
})

test('applyUsageToPlanting harvests and immediately redraws a new planting, seeding overflow', () => {
  const atlas = testAtlas()
  const state = { ...freshCompanionState(), active: plantingState() }
  const total = 300_000_000 // harvestTotal('crop', 'normal')
  const result = applyUsageToPlanting(state, total + 500, atlas)

  assert.equal(result.state.harvests.length, 1)
  assert.ok(result.state.active !== null)
  assert.equal(result.state.active?.stageIndex, 0)
  assert.equal(result.state.active?.usedAtStage, 500)
})

test('applyUsageToPlanting cascades through multiple full harvests for a huge delta', () => {
  const atlas = testAtlas()
  const state = { ...freshCompanionState(), active: plantingState() }
  // Assez pour au moins 2 récoltes complètes de crop/normal (300M chacune), quelle que soit
  // l'espèce/couleur retirée à chaque fois (le pire cas coûte 3B = tree/gold).
  const result = applyUsageToPlanting(state, 7_000_000_000, atlas)

  assert.ok(result.state.harvests.length >= 2)
  assert.equal(result.state.harvestedCount, result.state.harvests.length)
})

test('addToDailyStats accumulates tokens/chars within the same local day', () => {
  const now = new Date(2026, 2, 5, 10, 0)
  let state = freshCompanionState()
  state = addToDailyStats(state, now, 100, 10)
  state = addToDailyStats(state, new Date(2026, 2, 5, 23, 0), 50, 5)

  assert.equal(state.today.date, todayLocalDate(now))
  assert.equal(state.today.tokens, 150)
  assert.equal(state.today.chars, 15)
})

test('addToDailyStats resets when the local day changes', () => {
  let state = freshCompanionState()
  state = addToDailyStats(state, new Date(2026, 2, 5, 23, 59), 100, 10)
  state = addToDailyStats(state, new Date(2026, 2, 6, 0, 1), 5, 1)

  assert.equal(state.today.date, '2026-03-06')
  assert.equal(state.today.tokens, 5)
  assert.equal(state.today.chars, 1)
})

test('addToUsageSplit accumulates AI vs typed tokens separately, never resetting', () => {
  let state = freshCompanionState()
  state = addToUsageSplit(state, 1000, 200)
  state = addToUsageSplit(state, 500, 0)

  assert.equal(state.aiTokensSinceInstall, 1500)
  assert.equal(state.typedTokensSinceInstall, 200)
})

test('addToWeekHistory accumulates within the same local day', () => {
  const now = new Date(2026, 2, 5, 10, 0)
  let state = freshCompanionState()
  state = addToWeekHistory(state, now, 100, 10)
  state = addToWeekHistory(state, new Date(2026, 2, 5, 20, 0), 50, 5)

  assert.equal(state.weekHistory.length, 1)
  assert.equal(state.weekHistory[0]?.date, todayLocalDate(now))
  assert.equal(state.weekHistory[0]?.aiTokens, 150)
  assert.equal(state.weekHistory[0]?.typedTokens, 15)
})

test('addToWeekHistory keeps a separate entry per day', () => {
  let state = freshCompanionState()
  state = addToWeekHistory(state, new Date(2026, 2, 4, 10, 0), 100, 10)
  state = addToWeekHistory(state, new Date(2026, 2, 5, 10, 0), 200, 20)

  assert.equal(state.weekHistory.length, 2)
  assert.deepEqual(
    state.weekHistory.map((d) => d.date),
    ['2026-03-04', '2026-03-05'],
  )
})

test('addToWeekHistory prunes entries older than the 7-day window', () => {
  let state = freshCompanionState()
  state = addToWeekHistory(state, new Date(2026, 2, 1, 10, 0), 100, 10)
  state = addToWeekHistory(state, new Date(2026, 2, 10, 10, 0), 200, 20)

  assert.equal(state.weekHistory.length, 1)
  assert.equal(state.weekHistory[0]?.date, '2026-03-10')
})

test('updateBestDay sets the record from an empty state', () => {
  const state = freshCompanionState()
  const result = updateBestDay(state, { date: '2026-03-05', aiTokens: 100, typedTokens: 20 })

  assert.deepEqual(result.bestDay, { date: '2026-03-05', aiTokens: 100, typedTokens: 20 })
})

test('updateBestDay replaces the record when the combined total is higher', () => {
  let state = freshCompanionState()
  state = updateBestDay(state, { date: '2026-03-05', aiTokens: 100, typedTokens: 20 })
  state = updateBestDay(state, { date: '2026-03-06', aiTokens: 200, typedTokens: 0 })

  assert.equal(state.bestDay?.date, '2026-03-06')
})

test('updateBestDay keeps the existing record when the combined total is lower or equal', () => {
  let state = freshCompanionState()
  state = updateBestDay(state, { date: '2026-03-05', aiTokens: 100, typedTokens: 20 })
  state = updateBestDay(state, { date: '2026-03-06', aiTokens: 60, typedTokens: 60 })

  assert.equal(state.bestDay?.date, '2026-03-05')
})

test('updateBestDay can update the record for the same day as usage grows during the day', () => {
  let state = freshCompanionState()
  state = updateBestDay(state, { date: '2026-03-05', aiTokens: 100, typedTokens: 0 })
  state = updateBestDay(state, { date: '2026-03-05', aiTokens: 250, typedTokens: 0 })

  assert.equal(state.bestDay?.aiTokens, 250)
})
