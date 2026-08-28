import { RARITIES } from '../constants.js'
import { AppState, Rarity } from '../types.js'

type Unknown<T> = { [K in keyof T]: unknown }

export function sanitize(state: AppState, data: unknown) {
  if (!isRecord<Unknown<AppState>>(data)) {
    return
  }

  sanitizeFileOffsets(state, data)
  sanitizeTokens(state, data)
  sanitizeActive(state, data)
  sanitizeHarvests(state, data)
  sanitizeToday(state, data)
  sanitizeHistory(state, data)
  sanitizeBestDay(state, data)
}

function sanitizeBestDay(state: AppState, data: Unknown<AppState>) {
  if (
    isRecord<NonNullable<Unknown<AppState['bestDay']>>>(data.bestDay) &&
    typeof data.bestDay.date === 'string' &&
    isRecord(data.bestDay.tokens)
  ) {
    const dayTokens: Record<string, number> = {}
    for (const [source, tokens] of Object.entries(data.bestDay.tokens)) {
      if (typeof tokens === 'number') {
        dayTokens[source] = tokens
      }
    }
    state.bestDay = { date: data.bestDay.date, tokens: dayTokens }
  }
}

function sanitizeHistory(state: AppState, data: Unknown<AppState>) {
  if (isArray(data.weekHistory)) {
    for (const dayInfo of data.weekHistory) {
      if (isRecord<Unknown<AppState['weekHistory'][number]>>(dayInfo)) {
        if (typeof dayInfo.date === 'string' && isRecord(dayInfo.tokens)) {
          const dayTokens: Record<string, number> = {}
          for (const [source, tokens] of Object.entries(dayInfo.tokens)) {
            if (typeof tokens === 'number') {
              dayTokens[source] = tokens
            }
          }
          state.weekHistory.push({ date: dayInfo.date, tokens: dayTokens })
        }
      }
    }
  }
}

function sanitizeToday(state: AppState, data: Unknown<AppState>) {
  if (
    isRecord<Unknown<AppState['today']>>(data.today) &&
    typeof data.today.date === 'string' &&
    isRecord(data.today.tokens)
  ) {
    const todayTokens: Record<string, number> = {}
    for (const [source, tokens] of Object.entries(data.today.tokens)) {
      if (typeof tokens === 'number') {
        todayTokens[source] = tokens
      }
    }

    state.today = { date: data.today.date, tokens: todayTokens }
  }
}

function sanitizeHarvests(state: AppState, data: Unknown<AppState>) {
  if (isArray(data.harvests)) {
    for (const harvest of data.harvests) {
      if (isRecord<Unknown<AppState['harvests'][number]>>(harvest)) {
        if (typeof harvest.speciesId === 'string' && isRarity(harvest.rarity)) {
          state.harvests.push({
            speciesId: harvest.speciesId,
            rarity: harvest.rarity,
          })
        }
      }
    }
  }
}

function sanitizeActive(state: AppState, data: Unknown<AppState>) {
  if (
    isRecord<NonNullable<Unknown<AppState['active']>>>(data.active) &&
    typeof data.active.speciesId === 'string' &&
    isRarity(data.active.rarity) &&
    typeof data.active.tokens === 'number'
  ) {
    state.active = {
      speciesId: data.active.speciesId,
      rarity: data.active.rarity,
      tokens: data.active.tokens,
    }
  }
}

function sanitizeTokens(state: AppState, data: Unknown<AppState>) {
  if (isRecord(data.tokens)) {
    for (const [source, tokens] of Object.entries(data.tokens)) {
      if (typeof tokens === 'number') {
        state.tokens[source] = tokens
      }
    }
  }
}

function sanitizeFileOffsets(state: AppState, data: Unknown<AppState>) {
  if (isRecord<Unknown<AppState['fileOffsets']>>(data.fileOffsets)) {
    for (const [filePath, offset] of Object.entries(data.fileOffsets)) {
      if (typeof offset === 'number') {
        state.fileOffsets[filePath] = offset
      }
    }
  }
}

function isRecord<T extends Record<PropertyKey, unknown>>(data: unknown): data is T {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
}

function isArray(data: unknown): data is unknown[] {
  return typeof data === 'object' && data !== null && Array.isArray(data)
}

function isRarity(rarity: unknown): rarity is Rarity {
  return RARITIES.map(String).includes(String(rarity))
}
