import { MARKETS } from '../data/markets'
import type { Leg, Slip } from '../types'
import { chronologicalLegs, slipLegSummary } from '../lib/stats'

interface Props {
  slips: Slip[]
  onJumpMarket: (marketId: Slip['marketId']) => void
}

export function ResultsBoard({ slips, onJumpMarket }: Props) {
  const core = slips.filter((s) => !s.rebetOf)

  const rows = core.map((slip) => {
    const summary = slipLegSummary(slip)
    const settled = chronologicalLegs(slip).filter((l) => l.result !== 'pending')
    return { slip, summary, settled }
  })

  const anyMarked = rows.some((r) => r.summary.settled > 0)

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Self-check results</h2>
      </div>
      <div className="panel-body">
        {!anyMarked ? (
          <p className="empty">
            Tap <strong>W</strong> / <strong>L</strong> / <strong>V</strong> on each leg after the
            game. Settled picks appear here so you can audit the 20-fold.
          </p>
        ) : (
          <div className="results-board">
            {rows.map(({ slip, summary, settled }) => {
              const meta = MARKETS[slip.marketId]
              return (
                <div key={slip.id} className="results-market">
                  <button
                    type="button"
                    className="results-market-head"
                    style={{ borderColor: meta.color }}
                    onClick={() => onJumpMarket(slip.marketId)}
                  >
                    <span style={{ color: meta.color }}>{meta.shortLabel}</span>
                    <span>
                      {summary.won}W · {summary.lost}L · {summary.voided}V · {summary.pending} left
                    </span>
                    <span
                      className={`pill ${summary.dead ? 'dead' : summary.fullHit ? 'ok' : 'open'}`}
                    >
                      {summary.dead ? 'DEAD' : summary.fullHit ? 'HIT' : 'OPEN'}
                    </span>
                  </button>
                  {settled.length === 0 ? (
                    <p className="empty" style={{ padding: '0.35rem 0' }}>
                      No legs marked yet
                    </p>
                  ) : (
                    <ul className="results-list">
                      {settled.map((leg) => (
                        <ResultRow key={leg.id} leg={leg} />
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultRow({ leg }: { leg: Leg }) {
  const tone = leg.result === 'won' ? 'ok' : leg.result === 'lost' ? 'dead' : 'open'
  return (
    <li className={`results-row ${tone}`}>
      <span className="results-mark">{leg.result === 'won' ? 'W' : leg.result === 'lost' ? 'L' : 'V'}</span>
      <span className="results-body">
        <strong>
          {leg.home} vs {leg.away}
        </strong>
        <small>
          {leg.competition} · {leg.selection}
        </small>
      </span>
    </li>
  )
}
