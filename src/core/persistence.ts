import * as fs from 'fs/promises'
import * as path from 'path'
import { CompanionState, GardenKind, GardenColor, PlantingState, HarvestEntry, DailyStats, DayUsage } from '../types.js'
import { freshCompanionState, freshDailyStats, todayLocalDate } from './companionModel.js'
import { FileOffsets } from './trackers/usageTracker.js'

export interface PersistedData {
  companion: CompanionState
  fileOffsets: FileOffsets
}

function isGardenKind(value: unknown): value is GardenKind {
  return value === 'tree' || value === 'crop'
}

function isGardenColor(value: unknown): value is GardenColor {
  return value === 'normal' || value === 'silver' || value === 'gold'
}

function sanitizePlantingState(raw: unknown): PlantingState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.speciesId !== 'string' || !isGardenKind(obj.kind) || !isGardenColor(obj.color)) return null

  const totalStages = typeof obj.totalStages === 'number' && obj.totalStages > 0 ? obj.totalStages : 1
  return {
    speciesId: obj.speciesId,
    kind: obj.kind,
    color: obj.color,
    stageIndex: typeof obj.stageIndex === 'number' ? Math.max(0, Math.min(obj.stageIndex, totalStages - 1)) : 0,
    totalStages,
    usedAtStage: typeof obj.usedAtStage === 'number' ? obj.usedAtStage : 0,
  }
}

function sanitizeHarvestEntry(raw: unknown): HarvestEntry | null {
  if (typeof raw !== 'object' || raw === null) return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.speciesId !== 'string' || !isGardenKind(obj.kind) || !isGardenColor(obj.color)) return null

  return {
    speciesId: obj.speciesId,
    kind: obj.kind,
    color: obj.color,
    harvestedAt: typeof obj.harvestedAt === 'string' ? obj.harvestedAt : new Date().toISOString(),
  }
}

function sanitizeDailyStats(raw: unknown): DailyStats {
  const fresh = freshDailyStats(todayLocalDate(new Date()))
  if (typeof raw !== 'object' || raw === null) return fresh
  const obj = raw as Record<string, unknown>
  return {
    date: typeof obj.date === 'string' ? obj.date : fresh.date,
    tokens: typeof obj.tokens === 'number' ? obj.tokens : fresh.tokens,
    chars: typeof obj.chars === 'number' ? obj.chars : fresh.chars,
  }
}

function sanitizeDayUsage(raw: unknown): DayUsage | null {
  if (typeof raw !== 'object' || raw === null) return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.date !== 'string') return null
  return {
    date: obj.date,
    aiTokens: typeof obj.aiTokens === 'number' ? obj.aiTokens : 0,
    typedTokens: typeof obj.typedTokens === 'number' ? obj.typedTokens : 0,
  }
}

function sanitizeCompanionState(raw: unknown): CompanionState {
  const fresh = freshCompanionState()
  if (typeof raw !== 'object' || raw === null) return fresh
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.harvests)) return fresh // forme incompatible (ex: ancien état Pokémon) -> état frais

  return {
    installBaselineAt: typeof obj.installBaselineAt === 'string' ? obj.installBaselineAt : fresh.installBaselineAt,
    aiTokensSinceInstall:
      typeof obj.aiTokensSinceInstall === 'number' ? obj.aiTokensSinceInstall : fresh.aiTokensSinceInstall,
    typedTokensSinceInstall:
      typeof obj.typedTokensSinceInstall === 'number' ? obj.typedTokensSinceInstall : fresh.typedTokensSinceInstall,
    active: sanitizePlantingState(obj.active),
    harvests: obj.harvests.map(sanitizeHarvestEntry).filter((e): e is HarvestEntry => e !== null),
    harvestedCount: typeof obj.harvestedCount === 'number' ? obj.harvestedCount : fresh.harvestedCount,
    today: sanitizeDailyStats(obj.today),
    weekHistory: Array.isArray(obj.weekHistory)
      ? obj.weekHistory.map(sanitizeDayUsage).filter((d): d is DayUsage => d !== null)
      : fresh.weekHistory,
    bestDay: sanitizeDayUsage(obj.bestDay),
  }
}

function sanitizeFileOffsets(raw: unknown): FileOffsets {
  if (typeof raw !== 'object' || raw === null) return {}
  const offsets: FileOffsets = {}
  for (const [filePath, offset] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof offset === 'number') offsets[filePath] = offset
  }
  return offsets
}

function stateFilePath(storageDir: string): string {
  return path.join(storageDir, 'companion-state.json')
}

export async function loadPersistedData(storageDir: string): Promise<PersistedData> {
  const filePath = stateFilePath(storageDir)
  let raw: string
  try {
    raw = await fs.readFile(filePath, 'utf8')
  } catch {
    return { companion: freshCompanionState(), fileOffsets: {} }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    await fs.writeFile(`${filePath}.corrupt`, raw, 'utf8').catch(() => undefined)
    return { companion: freshCompanionState(), fileOffsets: {} }
  }

  const obj = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  return {
    companion: sanitizeCompanionState(obj.companion),
    fileOffsets: sanitizeFileOffsets(obj.fileOffsets),
  }
}

export async function savePersistedData(storageDir: string, data: PersistedData): Promise<void> {
  await fs.mkdir(storageDir, { recursive: true })
  const filePath = stateFilePath(storageDir)
  const tempPath = `${filePath}.tmp`
  await fs.writeFile(tempPath, JSON.stringify(data), 'utf8')
  await fs.rename(tempPath, filePath)
}
