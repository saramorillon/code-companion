import { Fragment, render } from 'preact'
import { formatRelativeDate } from '../../utils/format.js'
import { WithMessage } from '../WithMessage.js'

export interface IStatsProps {
  harvestedCount: number
  todayTokens: Record<string, string>
  bestDay: {
    date: string
    totalTokens: string
  }
  weekHistory: {
    date: string
    totalValue: number
    values: Record<string, number>
    totalTokens: string
    tokens: Record<string, string>
  }[]
  legend: string[]
}

function App({ harvestedCount, todayTokens, bestDay, weekHistory, legend }: IStatsProps) {
  return (
    <>
      <div className="stat-row">
        <span className="stat-label">Harvested</span>
        <span className="stat-value">{harvestedCount}</span>
      </div>
      <div className="stat-section">
        {Object.entries(todayTokens).map(([name, value]) => (
          <div key={name} className="stat-row">
            <span className="stat-label">{name}</span>
            <span className="stat-value">{value}</span>
          </div>
        ))}
        {bestDay && (
          <div className="stat-row">
            <span className="stat-label">🏆 Best day</span>
            <span className="stat-value">
              {bestDay.totalTokens} · {bestDay.date} · {formatRelativeDate(bestDay.date)}
            </span>
          </div>
        )}
      </div>
      <div className="stat-section">
        <div id="week-chart">
          {weekHistory.map((day) => {
            return (
              <div className="week-bar-column" key={day.date}>
                <div
                  className="week-bar-stack"
                  style={{ '--value': `${day.totalValue}%` }}
                  title={`${day.totalTokens} ${Object.entries(day.tokens)
                    .map(([name, value]) => `${name}: ${value}`)
                    .join(' / ')}`}
                >
                  {Object.entries(day.tokens).map(([name, value]) => (
                    <div key={name} className="week-bar" style={{ '--value': `${value}%` }} />
                  ))}
                </div>
                <div className="week-bar-label">{day.date}</div>
              </div>
            )
          })}
        </div>

        <div className="legend-row">
          {legend.map((name) => (
            <Fragment key={name}>
              <span className="legend-dot" />
              <span className="legend-label">{name}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </>
  )
}

render(<WithMessage view={App} />, document.body)
