import { assert, test } from 'vitest'
import {
  computeStats,
  plantingStageThreshold,
  harvestTotal,
  freshCompanionState,
  todayLocalDate,
} from '../src/core/companionModel.js'
import { GardenKind, GardenColor, HarvestEntry } from '../src/types.js'

const KINDS: GardenKind[] = ['tree', 'crop']
const COLORS: GardenColor[] = ['normal', 'silver', 'gold']

test('harvestTotal matches the confirmed threshold grid', () => {
  assert.equal(harvestTotal('crop', 'normal'), 300_000_000)
  assert.equal(harvestTotal('crop', 'silver'), 600_000_000)
  assert.equal(harvestTotal('crop', 'gold'), 1_200_000_000)
  assert.equal(harvestTotal('tree', 'normal'), 750_000_000)
  assert.equal(harvestTotal('tree', 'silver'), 1_500_000_000)
  assert.equal(harvestTotal('tree', 'gold'), 3_000_000_000)
})

test('plantingStageThreshold sums to harvestTotal across all stages', () => {
  for (const kind of KINDS) {
    for (const color of COLORS) {
      for (let totalStages = 1; totalStages <= 6; totalStages++) {
        let sum = 0
        for (let stageIndex = 0; stageIndex < totalStages; stageIndex++) {
          sum += plantingStageThreshold(kind, color, totalStages, stageIndex)
        }
        assert.equal(sum, harvestTotal(kind, color), `kind=${kind} color=${color} totalStages=${totalStages}`)
      }
    }
  }
})

test('plantingStageThreshold increases with stage index', () => {
  const thresholds = [0, 1, 2].map((stageIndex) => plantingStageThreshold('crop', 'normal', 3, stageIndex))
  assert.ok(thresholds[0]! < thresholds[1]!)
  assert.ok(thresholds[1]! < thresholds[2]!)
})

function harvestEntry(overrides: Partial<HarvestEntry> = {}): HarvestEntry {
  return {
    speciesId: 'apple',
    kind: 'tree',
    color: 'normal',
    harvestedAt: new Date().toISOString(),
    ...overrides,
  }
}

test('computeStats returns zeroed counters for a fresh state', () => {
  const now = new Date()
  const stats = computeStats(freshCompanionState(), now)
  assert.equal(stats.harvestedCount, 0)
  assert.deepEqual(stats.counts, {
    tree: { normal: 0, silver: 0, gold: 0 },
    crop: { normal: 0, silver: 0, gold: 0 },
  })
  assert.equal(stats.todayTokens, 0)
  assert.equal(stats.todayChars, 0)
})

test('computeStats reports harvestedCount independently of harvests length', () => {
  const now = new Date()
  const state = { ...freshCompanionState(), harvestedCount: 5, harvests: [harvestEntry()] }
  const stats = computeStats(state, now)
  assert.equal(stats.harvestedCount, 5)
})

test('computeStats tallies harvests by kind and color', () => {
  const now = new Date()
  const state = {
    ...freshCompanionState(),
    harvests: [
      harvestEntry({ kind: 'tree', color: 'normal' }),
      harvestEntry({ kind: 'tree', color: 'normal' }),
      harvestEntry({ kind: 'tree', color: 'gold' }),
      harvestEntry({ kind: 'crop', color: 'silver' }),
    ],
  }
  const stats = computeStats(state, now)
  assert.deepEqual(stats.counts, {
    tree: { normal: 2, silver: 0, gold: 1 },
    crop: { normal: 0, silver: 1, gold: 0 },
  })
})

test('computeStats reports today tokens/chars when the stored date matches today', () => {
  const now = new Date(2026, 2, 5, 14, 30)
  const state = { ...freshCompanionState(), today: { date: todayLocalDate(now), tokens: 1234, chars: 56 } }
  const stats = computeStats(state, now)
  assert.equal(stats.todayTokens, 1234)
  assert.equal(stats.todayChars, 56)
})

test('computeStats reports zero today tokens/chars for a stale date', () => {
  const now = new Date(2026, 2, 5, 14, 30)
  const state = { ...freshCompanionState(), today: { date: '2026-03-04', tokens: 1234, chars: 56 } }
  const stats = computeStats(state, now)
  assert.equal(stats.todayTokens, 0)
  assert.equal(stats.todayChars, 0)
})

test('computeStats passes through cumulative AI vs typed token totals', () => {
  const now = new Date()
  const state = { ...freshCompanionState(), aiTokensSinceInstall: 900_000, typedTokensSinceInstall: 100_000 }
  const stats = computeStats(state, now)
  assert.equal(stats.aiTokensSinceInstall, 900_000)
  assert.equal(stats.typedTokensSinceInstall, 100_000)
})

test('computeStats returns a 7-day sliding window ending today, filling missing days with zeros', () => {
  const now = new Date(2026, 2, 10, 12, 0)
  const state = {
    ...freshCompanionState(),
    weekHistory: [
      { date: '2026-03-08', aiTokens: 100, typedTokens: 10 },
      { date: '2026-03-10', aiTokens: 200, typedTokens: 20 },
      { date: '2026-02-20', aiTokens: 999, typedTokens: 999 }, // hors fenêtre, doit être ignoré
    ],
  }
  const stats = computeStats(state, now)

  assert.equal(stats.weekHistory.length, 7)
  assert.deepEqual(
    stats.weekHistory.map((d) => d.date),
    ['2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10'],
  )
  assert.deepEqual(stats.weekHistory[4], { date: '2026-03-08', aiTokens: 100, typedTokens: 10 })
  assert.deepEqual(stats.weekHistory[5], { date: '2026-03-09', aiTokens: 0, typedTokens: 0 })
  assert.deepEqual(stats.weekHistory[6], { date: '2026-03-10', aiTokens: 200, typedTokens: 20 })
})

test('todayLocalDate formats using local date components, zero-padded', () => {
  assert.equal(todayLocalDate(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
  assert.equal(todayLocalDate(new Date(2026, 11, 31, 0, 0)), '2026-12-31')
})

test('computeStats passes through the best day record unchanged', () => {
  const now = new Date()
  const bestDay = { date: '2026-03-05', aiTokens: 100, typedTokens: 20 }
  const state = { ...freshCompanionState(), bestDay }
  const stats = computeStats(state, now)
  assert.deepEqual(stats.bestDay, bestDay)
})

test('computeStats reports a null best day when none is recorded yet', () => {
  const stats = computeStats(freshCompanionState(), new Date())
  assert.equal(stats.bestDay, null)
})
