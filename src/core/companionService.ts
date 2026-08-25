import { TYPED_CHAR_TOKEN_EQUIVALENT } from '../constants.js'
import { GardenKind, GardenColor, CompanionState, HarvestEntry, CompanionStats } from '../types.js'
import { computeStats, plantingStageThreshold } from './companionModel.js'
import {
  newPlanting,
  applyUsageToPlanting,
  seedInstallBaseline,
  addToDailyStats,
  addToUsageSplit,
  addToWeekHistory,
  updateBestDay,
} from './companionStore.js'
import { GardenAtlas, loadGardenAtlas, findSpecies } from './gardenAtlas.js'
import { loadPersistedData, savePersistedData } from './persistence.js'
import { scanForNewTokens, FileOffsets } from './trackers/usageTracker.js'

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

export class CompanionService {
  private state: CompanionState
  private fileOffsets: FileOffsets

  private constructor(
    state: CompanionState,
    fileOffsets: FileOffsets,
    private readonly storageDir: string,
    private readonly atlas: GardenAtlas,
  ) {
    this.state = state
    this.fileOffsets = fileOffsets
  }

  static async create(storageDir: string, extensionRootPath: string): Promise<CompanionService> {
    const persisted = await loadPersistedData(storageDir)
    const atlas = loadGardenAtlas(extensionRootPath)
    const service = new CompanionService(persisted.companion, persisted.fileOffsets, storageDir, atlas)
    if (!service.state.active) {
      service.state = { ...service.state, active: newPlanting(atlas) }
    }
    return service
  }

  private async persist(): Promise<void> {
    await savePersistedData(this.storageDir, { companion: this.state, fileOffsets: this.fileOffsets })
  }

  harvestEntries(): HarvestEntry[] {
    return this.state.harvests
  }

  stats(): CompanionStats {
    return computeStats(this.state, new Date())
  }

  async refresh(typedChars: number): Promise<CompanionViewState> {
    if (!this.state.installBaselineAt) {
      this.state = seedInstallBaseline(this.state, new Date())
      await this.persist()
      return this.toViewState()
    }

    const scan = await scanForNewTokens(this.fileOffsets, new Date(this.state.installBaselineAt))
    this.fileOffsets = scan.offsets

    const typedTokens = typedChars * TYPED_CHAR_TOKEN_EQUIVALENT
    const delta = scan.tokens + typedTokens

    if (scan.tokens > 0 || typedChars > 0) {
      const now = new Date()
      this.state = addToDailyStats(this.state, now, scan.tokens, typedChars)
      this.state = addToUsageSplit(this.state, scan.tokens, typedTokens)
      this.state = addToWeekHistory(this.state, now, scan.tokens, typedTokens)
      this.state = updateBestDay(this.state, this.state.weekHistory[this.state.weekHistory.length - 1]!)
    }

    if (delta > 0) {
      const result = applyUsageToPlanting(this.state, delta, this.atlas)
      this.state = result.state
    }

    await this.persist()
    return this.toViewState()
  }

  private toViewState(): CompanionViewState {
    const planting = this.state.active
    const species = planting ? findSpecies(this.atlas, planting.kind, planting.speciesId) : null

    return {
      speciesId: planting?.speciesId ?? null,
      speciesName: species?.name ?? null,
      kind: planting?.kind ?? null,
      color: planting?.color ?? null,
      stageIndex: planting?.stageIndex ?? null,
      totalStages: planting?.totalStages ?? null,
      usedAtStage: planting?.usedAtStage ?? 0,
      stageThreshold: planting
        ? plantingStageThreshold(planting.kind, planting.color, planting.totalStages, planting.stageIndex)
        : null,
      usedSinceInstall: this.state.aiTokensSinceInstall + this.state.typedTokensSinceInstall,
      aiTokensSinceInstall: this.state.aiTokensSinceInstall,
      typedTokensSinceInstall: this.state.typedTokensSinceInstall,
    }
  }
}
