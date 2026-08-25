import { useEffect, useMemo, useState } from 'react'
import { MARKETS, MARKET_ORDER, createWeekBundle } from './data/seedSlips'
import { SlipPanel } from './components/SlipPanel'
import { RankingsPanel } from './components/RankingsPanel'
import { RebetPanel } from './components/RebetPanel'
import { buildRebetSlip, getRebetSuggestions } from './lib/rebet'
import { bestMarket, computeMarketStats } from './lib/stats'
import {
  addSlipToWeek,
  ensureActiveWeek,
  getActiveWeek,
  loadState,
  saveState,
  updateSlipInState,
} from './lib/storage'
import type { AppState, LegResult, MarketId } from './types'
import './index.css'

export default function App() {
  const [state, setState] = useState<AppState>(() => ensureActiveWeek(loadState()))
  const [activeMarket, setActiveMarket] = useState<MarketId>('team_to_score')
  const [dismissedRebets, setDismissedRebets] = useState<string[]>([])

  useEffect(() => {
    saveState(state)
  }, [state])

  const week = getActiveWeek(state)
  const slips = week?.slips ?? []

  const primarySlips = useMemo(
    () =>
      MARKET_ORDER.map((id) => slips.find((s) => s.marketId === id && !s.rebetOf)).filter(
        (s): s is NonNullable<typeof s> => Boolean(s),
      ),
    [slips],
  )

  const activeSlip =
    slips.find((s) => s.marketId === activeMarket && !s.rebetOf) ??
    slips.find((s) => s.marketId === activeMarket)

  const rebetsForMarket = slips.filter((s) => s.marketId === activeMarket && s.rebetOf)

  const suggestions = useMemo(
    () =>
      getRebetSuggestions(slips, state.defaultStake).filter(
        (s) => !dismissedRebets.includes(s.slipId),
      ),
    [slips, state.defaultStake, dismissedRebets],
  )

  const stats = useMemo(() => computeMarketStats(state.weeks), [state.weeks])
  const topMarket = useMemo(() => bestMarket(state.weeks), [state.weeks])

  function setLegResult(slipId: string, legId: string, result: LegResult) {
    if (!week) return
    setState((prev) =>
      updateSlipInState(prev, week.weekKey, slipId, (slip) => {
        const legs = slip.legs.map((l) => (l.id === legId ? { ...l, result } : l))
        const pending = legs.some((l) => l.result === 'pending')
        return { ...slip, legs, status: pending ? 'open' : 'settled' }
      }),
    )
  }

  function acceptRebet(slipId: string) {
    if (!week) return
    const suggestion = suggestions.find((s) => s.slipId === slipId)
    const original = slips.find((s) => s.id === slipId)
    if (!suggestion || !original) return
    const rebet = buildRebetSlip(original, suggestion.remainingLegs, suggestion.suggestedStake)
    setState((prev) => addSlipToWeek(prev, week.weekKey, rebet))
    setActiveMarket(original.marketId)
  }

  function newWeek() {
    const weekBundle = createWeekBundle(state.defaultStake)
    // Avoid clobbering same week key — bump label with timestamp if needed
    const exists = state.weeks.some((w) => w.weekKey === weekBundle.weekKey)
    const key = exists ? `${weekBundle.weekKey}-${Date.now()}` : weekBundle.weekKey
    const next = {
      ...weekBundle,
      weekKey: key,
      label: exists ? `${weekBundle.label} (new)` : weekBundle.label,
      slips: weekBundle.slips.map((s) => ({ ...s, weekKey: key })),
    }
    setState((prev) => ({
      ...prev,
      weeks: [next, ...prev.weeks],
      activeWeekKey: key,
    }))
    setDismissedRebets([])
    setActiveMarket('team_to_score')
  }

  function resetDemoResults() {
    if (!week) return
    setState((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.weekKey !== week.weekKey) return w
        return {
          ...w,
          slips: w.slips.map((s) => ({
            ...s,
            status: 'open' as const,
            legs: s.legs.map((l) => ({ ...l, result: 'pending' as const })),
          })),
        }
      }),
    }))
    setDismissedRebets([])
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-top">
          <div>
            <h1 className="brand">
              Lotto<span>Slips</span>
            </h1>
            <p>
              Always builds the four 20-folds — Team Goals (strong sides Over 1.5 / others to
              score), match Over 1.5, Under 4.5, Double Chance — tracks results, suggests rebets,
              and ranks the best market.
            </p>
          </div>
          <div className="hero-actions">
            <label className="stake-field">
              Stake
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={state.defaultStake}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    defaultStake: Math.max(0.1, Number(e.target.value) || 1),
                  }))
                }
              />
            </label>
            <select
              className="week-select"
              value={state.activeWeekKey}
              onChange={(e) =>
                setState((prev) => ({ ...prev, activeWeekKey: e.target.value }))
              }
            >
              {state.weeks.map((w) => (
                <option key={w.weekKey} value={w.weekKey}>
                  {w.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={newWeek}>
              New week · 4 slips
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetDemoResults}>
              Reset results
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        <section className="panel">
          <div className="panel-head">
            <h2>{week?.label ?? 'Active week'}</h2>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {primarySlips.length}/4 core slips
            </span>
          </div>
          <div className="panel-body">
            <div className="market-tabs">
              {MARKET_ORDER.map((id) => {
                const meta = MARKETS[id]
                const slip = slips.find((s) => s.marketId === id && !s.rebetOf)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`market-tab ${activeMarket === id ? 'active' : ''}`}
                    style={{ ['--accent' as string]: meta.color }}
                    onClick={() => setActiveMarket(id)}
                  >
                    <strong>{meta.shortLabel}</strong>
                    <small>{slip ? `${slip.legs.length} legs` : '—'}</small>
                  </button>
                )
              })}
            </div>

            {activeSlip ? (
              <>
                <SlipPanel
                  slip={activeSlip}
                  onSetResult={(legId, result) => setLegResult(activeSlip.id, legId, result)}
                />
                {rebetsForMarket.map((rebet) => (
                  <div key={rebet.id} style={{ marginTop: '1.25rem' }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        margin: '0 0 0.6rem',
                        fontSize: '1rem',
                      }}
                    >
                      {rebet.title}
                    </h3>
                    <SlipPanel
                      slip={rebet}
                      onSetResult={(legId, result) => setLegResult(rebet.id, legId, result)}
                    />
                  </div>
                ))}
              </>
            ) : (
              <p className="empty">No slip for this market. Create a new week.</p>
            )}
          </div>
        </section>

        <aside className="side-stack">
          <RebetPanel
            suggestions={suggestions}
            onAccept={acceptRebet}
            onDismiss={(id) => setDismissedRebets((prev) => [...prev, id])}
          />
          <RankingsPanel stats={stats} bestId={topMarket} />
        </aside>
      </div>

      <p className="footer-note">
        Data stays in your browser (localStorage). Seed card is the Aug 25–30 2026 lotto set —
        generate a new week anytime to refresh the four slips. Not betting advice.
      </p>
    </div>
  )
}
