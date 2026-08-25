import { render } from 'preact'
import { COUNT_ROWS } from '../../constants.js'
import { CompanionStats } from '../../types.js'
import { formatTokensCompact, KindRarity } from '../shared.js'
import { WithMessage } from '../WithMessage.js'
import { BestDayCard } from './components/BestDayCard.js'
import { WeekChart } from './components/WeekChart.js'

function App(stats: CompanionStats) {
  const total = stats.aiTokensSinceInstall + stats.typedTokensSinceInstall
  const aiPercent = total > 0 ? (stats.aiTokensSinceInstall / total) * 100 : 50

  return (
    <>
      <div className="stat-row">
        <span className="stat-label">Harvested</span>
        <span className="stat-value">{stats.harvestedCount}</span>
      </div>
      <div className="rarity-section">
        {COUNT_ROWS.map(({ kind, color }) => (
          <div className="rarity-row" key={`${kind}|${color}`}>
            <span>
              <KindRarity kind={kind} color={color} />
            </span>
            <span className="stat-value">{stats.counts[kind][color]}</span>
          </div>
        ))}
      </div>
      <div className="stat-section">
        <div className="stat-row">
          <span className="stat-label">Tokens today</span>
          <span className="stat-value">{formatTokensCompact(stats.todayTokens)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Characters today</span>
          <span className="stat-value">{formatTokensCompact(stats.todayChars)}</span>
        </div>
      </div>
      <div className="stat-section">
        <div id="ratio-donut" style={{ '--ratio-ai-percent': `${aiPercent}%` }} />
        <div className="legend-row">
          <span className="legend-dot legend-ai" />
          <span className="legend-label">AI</span>
          <span className="stat-value">{Math.round(aiPercent)}%</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot legend-typed" />
          <span className="legend-label">Typed</span>
          <span className="stat-value">{Math.round(100 - aiPercent)}%</span>
        </div>
      </div>
      <div className="stat-section">
        <WeekChart weekHistory={stats.weekHistory} />
        <div className="legend-row">
          <span className="legend-dot legend-ai" />
          <span className="legend-label">AI</span>
          <span className="legend-dot legend-typed" />
          <span className="legend-label">Typed</span>
        </div>
        <BestDayCard bestDay={stats.bestDay} />
      </div>
    </>
  )
}

render(<WithMessage view={App} />, document.body)
