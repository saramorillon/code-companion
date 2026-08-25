import { DayUsage } from '../../../types.js'
import { formatTokensCompact } from '../../shared.js'
import { parseLocalDate } from '../utils.js'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WeekChart({ weekHistory }: { weekHistory: DayUsage[] }) {
  const maxTotal = Math.max(1, ...weekHistory.map((day) => day.aiTokens + day.typedTokens))

  return (
    <div id="week-chart">
      {weekHistory.map((day) => {
        const dayTotal = day.aiTokens + day.typedTokens
        const stackHeight = (dayTotal / maxTotal) * 100
        const aiHeight = dayTotal > 0 ? (day.aiTokens / dayTotal) * 100 : 0
        const typedHeight = dayTotal > 0 ? (day.typedTokens / dayTotal) * 100 : 0
        const label = weekdayLabels[parseLocalDate(day.date).getDay()]

        return (
          <div className="week-bar-column" key={day.date}>
            <div
              className="week-bar-stack"
              style={{ height: `${stackHeight}%` }}
              title={`${formatTokensCompact(dayTotal)} (AI ${formatTokensCompact(day.aiTokens)} / Typed ${formatTokensCompact(day.typedTokens)})`}
            >
              <div className="week-bar-ai" style={{ height: `${aiHeight}%` }} />
              <div className="week-bar-typed" style={{ height: `${typedHeight}%` }} />
            </div>
            <div className="week-bar-label">{label}</div>
          </div>
        )
      })}
    </div>
  )
}
