import { MARKETS } from '../data/seedSlips'
import type { MarketStats } from '../types'

interface Props {
  stats: MarketStats[]
  bestId: string | null
}

export function RankingsPanel({ stats, bestId }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Market rankings</h2>
      </div>
      <div className="panel-body">
        {stats.every((s) => s.legsPlayed === 0) ? (
          <p className="empty">
            Mark legs W/L to rank markets. Score weights leg hit-rate first, then ROI and full-slip hits.
          </p>
        ) : (
          <div className="rank-list">
            {stats.map((s, i) => {
              const color = MARKETS[s.marketId].color
              return (
                <div
                  key={s.marketId}
                  className={`rank-item ${s.marketId === bestId ? 'top' : ''}`}
                >
                  <div className="rank-pos">{i + 1}</div>
                  <div>
                    <h3 style={{ color }}>{s.label}</h3>
                    <p>
                      Legs {s.legsWon}/{s.legsPlayed} ({s.legHitRate.toFixed(0)}%) · slips{' '}
                      {s.fullHits}/{s.settledSlips || 0} · ROI {s.roi.toFixed(0)}%
                    </p>
                  </div>
                  <div className="rank-score">
                    {s.rankScore.toFixed(0)}
                    <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>score</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
