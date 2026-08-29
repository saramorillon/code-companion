import { mkdir, readFile, writeFile } from 'fs/promises'
import { join, parse } from 'path'
import { STAGES } from '../constants.js'
import { AppState } from '../types.js'
import { sum } from '../utils/array.js'
import { formatLocaleDate } from '../utils/format.js'
import { sanitize } from '../utils/sanitize.js'
import { AtlasManager } from './AtlasManager.js'

const ms_7days = 604800000

export class DataManager {
  private filePath: string
  state: AppState

  constructor(storageDir: string) {
    this.filePath = join(storageDir, 'companion-state.json')
    const today = formatLocaleDate(new Date())
    this.state = {
      tokens: {},
      active: AtlasManager.pickRandomSpecies(),
      harvests: [],
      today: {
        date: today,
        tokens: {},
      },
      weekHistory: [],
      bestDay: {
        date: today,
        tokens: {},
      },
      fileOffsets: {},
    }
  }

  async loadData() {
    let raw: string
    try {
      raw = await readFile(this.filePath, 'utf8')
    } catch {
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      await writeFile(`${this.filePath}.corrupt`, raw, 'utf8').catch(() => undefined)
      return
    }

    sanitize(this.state, parsed)
  }

  async saveData() {
    await mkdir(parse(this.filePath).dir, { recursive: true })
    await writeFile(this.filePath, JSON.stringify(this.state), 'utf8')
  }

  update(name: string, tokens: number) {
    this.state.tokens[name] = (this.state.tokens[name] ?? 0) + tokens
    this.updateToday(name, tokens)
    this.updateHistory()
    this.updateBestDay()
    this.updateActive(tokens)
  }

  updateToday(name: string, tokens: number) {
    const today = formatLocaleDate(new Date())
    if (this.state.today.date !== today) {
      this.state.today = { date: today, tokens: {} }
    }
    this.state.today.tokens[name] = (this.state.today.tokens[name] ?? 0) + tokens
  }

  updateHistory() {
    const now = new Date()
    const sevenDaysAgo = formatLocaleDate(new Date(now.getTime() - ms_7days))
    this.state.weekHistory = this.state.weekHistory.filter((history) => history.date >= sevenDaysAgo)

    const history = Object.fromEntries(this.state.weekHistory.map((history) => [history.date, history.tokens]))
    const today = formatLocaleDate(now)
    for (const [key, tokens] of Object.entries(this.state.today.tokens)) {
      if (history[today]) {
        history[today][key] = (history[today][key] ?? 0) + tokens
      } else {
        history[today] = { [key]: tokens }
      }
    }
    this.state.weekHistory = Object.entries(history).map(([date, tokens]) => ({ date, tokens }))
  }

  updateBestDay() {
    const today = formatLocaleDate(new Date())
    const todayTokens = sum(Object.values(this.state.today.tokens))
    if (todayTokens > sum(Object.values(this.state.bestDay.tokens))) {
      this.state.bestDay = { date: today, tokens: this.state.today.tokens }
    }
  }

  updateActive(tokens: number) {
    this.state.active.tokens += tokens

    const species = AtlasManager.getSpeciesById(this.state.active.speciesId)
    if (!species) {
      return
    }

    const totalTokens = STAGES[`${species.category}-${this.state.active.rarity}`].at(-1)
    if (totalTokens === undefined) {
      return
    }

    console.log(this.state.active.tokens, totalTokens)

    if (this.state.active.tokens >= totalTokens) {
      this.state.harvests.push({
        speciesId: this.state.active.speciesId,
        rarity: this.state.active.rarity,
      })
      const overflow = this.state.active.tokens - totalTokens
      this.state.active = AtlasManager.pickRandomSpecies()
      this.state.active.tokens = overflow
      this.updateActive(0)
    }
  }
}
