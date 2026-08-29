import { PROVIDERS } from '../constants.js'
import { AppState } from '../types.js'
import { sum } from '../utils/array.js'
import { formatTokens } from '../utils/format.js'
import { IStatsProps } from '../views/stats/App.js'
import { AbstractViewProvider } from './AbstractViewProvider.js'

export class StatsViewProvider extends AbstractViewProvider<IStatsProps> {
  override readonly viewId = 'devcompanion.stats'
  override readonly viewName = 'stats'

  protected override buildState(state: AppState): IStatsProps | null {
    const maxTokens = Math.max(...state.weekHistory.map((history) => sum(Object.values(history.tokens))))

    const weekHistory: IStatsProps['weekHistory'] = []
    for (const history of state.weekHistory) {
      const totalTokens = sum(Object.values(history.tokens))
      weekHistory.push({
        date: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(history.date)),
        percent: `${(totalTokens / maxTokens) * 100}%`,
        tokens: formatTokens(totalTokens),
        values: Object.entries(history.tokens).map(([source, value]) => ({
          source,
          percent: `${(value / totalTokens) * 100}%`,
          tokens: formatTokens(value),
        })),
      })
    }

    while (weekHistory.length < 7) {
      weekHistory.unshift({ date: '', percent: '', tokens: '', values: [] })
    }

    const totalTokens = formatTokens(sum(Object.values(state.bestDay.tokens)))
    const todayTokens = Object.fromEntries(
      Object.entries(state.today.tokens).map(([key, value]) => [key, formatTokens(value)]),
    )

    return {
      harvestedCount: state.harvests.length,
      todayTokens,
      bestDay: { date: state.bestDay.date, totalTokens },
      weekHistory,
      legend: [...PROVIDERS],
    }
  }
}
