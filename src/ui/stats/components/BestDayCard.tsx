import { BestDay } from '../../../types.js'
import { formatTokensCompact } from '../../shared.js'
import { parseLocalDate, daysAgoLabel } from '../utils.js'

export function BestDayCard({ bestDay }: { bestDay: BestDay | null }) {
  if (!bestDay) return <div id="best-day-card" style={{ display: 'none' }} />

  const date = parseLocalDate(bestDay.date)
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div id="best-day-card" style={{ display: 'flex' }}>
      <div id="best-day-trophy">🏆</div>
      <div id="best-day-info">
        <div id="best-day-title">Best day</div>
        <div id="best-day-value">{formatTokensCompact(bestDay.aiTokens + bestDay.typedTokens)}</div>
        <div id="best-day-date">
          {label} · {daysAgoLabel(date)}
        </div>
      </div>
    </div>
  )
}
