import type { RebetSuggestion } from '../types'

interface Props {
  suggestions: RebetSuggestion[]
  onAccept: (slipId: string) => void
  onDismiss: (slipId: string) => void
}

export function RebetPanel({ suggestions, onAccept, onDismiss }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Rebet suggestions</h2>
      </div>
      <div className="panel-body">
        {suggestions.length === 0 ? (
          <p className="empty">
            If the first one or two kickoffs on a slip lose, a rebet on the remaining legs will appear
            here.
          </p>
        ) : (
          <div className="rebet-list">
            {suggestions.map((s) => (
              <div key={s.slipId} className="rebet-card">
                <span className={`urgency ${s.urgency}`}>{s.urgency} priority</span>
                <h3>{s.marketLabel}</h3>
                <p>{s.reason}</p>
                <p style={{ marginTop: '0.45rem' }}>
                  Suggested stake <strong style={{ color: 'var(--text)' }}>{s.suggestedStake}</strong>{' '}
                  · {s.remainingLegs.length} legs
                </p>
                <div className="rebet-actions">
                  <button type="button" className="btn btn-primary" onClick={() => onAccept(s.slipId)}>
                    Create rebet
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => onDismiss(s.slipId)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
