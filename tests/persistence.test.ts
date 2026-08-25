import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { assert, test, beforeEach, afterEach } from 'vitest'
import { freshCompanionState } from '../src/core/companionModel.js'
import { loadPersistedData, savePersistedData } from '../src/core/persistence.js'
import { PlantingState, HarvestEntry } from '../src/types.js'

let storageDir: string

beforeEach(async () => {
  storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codecompanion-storage-'))
})

afterEach(async () => {
  await fs.rm(storageDir, { recursive: true, force: true })
})

async function writeRawState(storageDir: string, content: unknown): Promise<void> {
  await fs.mkdir(storageDir, { recursive: true })
  await fs.writeFile(path.join(storageDir, 'companion-state.json'), JSON.stringify(content), 'utf8')
}

test('an old save (no harvests array) falls back to a fresh garden state, but keeps fileOffsets', async () => {
  await writeRawState(storageDir, {
    companion: {
      installBaselineAt: '2025-01-01T00:00:00.000Z',
      eggUsage: 12345,
      active: { baseId: 1, pathIds: [1, 2, 3], rarity: 'common', nature: 'Hardy' },
      dex: [],
      hatchedCount: 3,
    },
    fileOffsets: { '/some/session.jsonl': 4096 },
  })

  const result = await loadPersistedData(storageDir)

  assert.deepEqual(result.companion, freshCompanionState())
  assert.deepEqual(result.fileOffsets, { '/some/session.jsonl': 4096 })
})

test('a full garden-shaped save round-trips correctly', async () => {
  const planting: PlantingState = {
    speciesId: 'apple',
    kind: 'tree',
    color: 'gold',
    stageIndex: 2,
    totalStages: 4,
    usedAtStage: 12345,
  }
  const harvest: HarvestEntry = {
    speciesId: 'corn',
    kind: 'crop',
    color: 'silver',
    harvestedAt: '2026-03-05T10:00:00.000Z',
  }
  const companion = {
    ...freshCompanionState(),
    installBaselineAt: '2025-01-01T00:00:00.000Z',
    active: planting,
    harvests: [harvest],
    harvestedCount: 1,
  }

  await savePersistedData(storageDir, { companion, fileOffsets: { '/a.jsonl': 10 } })
  const result = await loadPersistedData(storageDir)

  assert.deepEqual(result.companion, companion)
  assert.deepEqual(result.fileOffsets, { '/a.jsonl': 10 })
})

test('an out-of-range active.stageIndex is clamped to totalStages - 1', async () => {
  await writeRawState(storageDir, {
    companion: {
      ...freshCompanionState(),
      active: { speciesId: 'apple', kind: 'tree', color: 'normal', stageIndex: 99, totalStages: 4, usedAtStage: 0 },
    },
    fileOffsets: {},
  })

  const result = await loadPersistedData(storageDir)

  assert.equal(result.companion.active?.stageIndex, 3)
})

test('a negative active.stageIndex is clamped to 0', async () => {
  await writeRawState(storageDir, {
    companion: {
      ...freshCompanionState(),
      active: { speciesId: 'apple', kind: 'tree', color: 'normal', stageIndex: -5, totalStages: 4, usedAtStage: 0 },
    },
    fileOffsets: {},
  })

  const result = await loadPersistedData(storageDir)

  assert.equal(result.companion.active?.stageIndex, 0)
})

test('malformed harvest entries are filtered out, valid ones kept', async () => {
  await writeRawState(storageDir, {
    companion: {
      ...freshCompanionState(),
      harvests: [
        { speciesId: 'apple', kind: 'tree', color: 'normal', harvestedAt: '2026-01-01T00:00:00.000Z' },
        { speciesId: 'apple' }, // manque kind/color -> filtré
        { kind: 'tree', color: 'normal' }, // manque speciesId -> filtré
      ],
    },
    fileOffsets: {},
  })

  const result = await loadPersistedData(storageDir)

  assert.equal(result.companion.harvests.length, 1)
  assert.equal(result.companion.harvests[0]?.speciesId, 'apple')
})
