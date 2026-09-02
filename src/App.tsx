import { useEffect, useMemo, useState } from 'react'
import { CARD_VERSION, MARKETS, MARKET_ORDER, MIX_TIER_CONFIGS, loadWeeklyCard } from './data/seedSlips'
import { SlipPanel } from './components/SlipPanel'
import { RankingsPanel } from './components/RankingsPanel'
import { RebetPanel } from './components/RebetPanel'
import { ResultsBoard } from './components/ResultsBoard'
import { ScoresPanel } from './components/ScoresPanel'
import { buildRebetSlip, getRebetSuggestions } from './lib/rebet'
import { applyScoresToSlips } from './lib/settle'
import { bestMarket, computeMarketStats } from './lib/stats'
import {
  addSlipToWeek,
  applyFetchedCard,
  createNewWeek,
  ensureActiveWeek,
  getActiveCard,
  getActiveWeek,
  hardResetState,
  loadState,
  replaceActiveWeek,
  saveState,
  updateSlipInState,
} from './lib/storage'
import type { AppState, LegResult, MarketId, MixTier } from './types'
import './index.css'

const GITHUB_PAGES_URL = 'https://ronnynkhori.github.io/lottoslips/'

export default function App() {
  const [state, setState] = useState<AppState>(() => ensureActiveWeek(loadState()))
  const [activeMarket, setActiveMarket] = useState<MarketId>('team_to_score')
  const [activeMixTier, setActiveMixTier] = useState<MixTier>('value')
  const [dismissedRebets, setDismissedRebets] = useState<string[]>([])
  const liveUrl = useMemo(() => {
    if (typeof window === 'undefined') return GITHUB_PAGES_URL
    return window.location.hostname.endsWith('vercel.app')
      ? `${window.location.origin}/`
      : GITHUB_PAGES_URL
  }, [])
  const [flash, setFlash] = useState<string | null>(null)
  const [cardLoading, setCardLoading] = useState(true)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const card = await loadWeeklyCard()
      if (cancelled) return
      setState((prev) => applyFetchedCard(prev, card))
      setCardLoading(false)
      setFlash(`Card v${card.cardVersion} loaded · ${card.label}`)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 2500)
    return () => window.clearTimeout(t)
  }, [flash])

  const week = getActiveWeek(state)
  const slips = week?.slips ?? []
  const scores = state.scores ?? {}
  const card = getActiveCard()

  const primarySlips = useMemo(
    () =>
      MARKET_ORDER.map((id) => slips.find((s) => s.marketId === id && !s.rebetOf)).filter(
        (s): s is NonNullable<typeof s> => Boolean(s),
      ),
    [slips],
  )

  const mixSlips = useMemo(
    () => slips.filter((s) => s.marketId === 'mixed' && !s.rebetOf),
    [slips],
  )

  const activeSlip =
    activeMarket === 'mixed'
      ? (mixSlips.find((s) => s.mixTier === activeMixTier) ?? mixSlips[0])
      : (slips.find((s) => s.marketId === activeMarket && !s.rebetOf) ??
        slips.find((s) => s.marketId === activeMarket))

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
        const legs = slip.legs.map((l) =>
          l.id === legId
            ? { ...l, result, resultSource: result === 'pending' ? undefined : ('manual' as const) }
            : l,
        )
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
    setFlash(`Rebet created for ${MARKETS[original.marketId].shortLabel}`)
  }

  function newWeek() {
    setState((prev) => createNewWeek(prev, getActiveCard()))
    setDismissedRebets([])
    setActiveMarket('team_to_score')
    setFlash('New week loaded from current card')
  }

  function clearResultsOnly() {
    if (!week) return
    setState((prev) => ({
      ...prev,
      scores: {},
      weeks: prev.weeks.map((w) => {
        if (w.weekKey !== week.weekKey) return w
        return {
          ...w,
          slips: w.slips.map((s) => ({
            ...s,
            status: 'open' as const,
            legs: s.legs.map((l) => ({
              ...l,
              result: 'pending' as const,
              resultSource: undefined,
            })),
          })),
        }
      }),
    }))
    setDismissedRebets([])
    setFlash('All W/L/V marks and FT scores cleared')
  }

  async function reloadFixtures() {
    setCardLoading(true)
    const nextCard = await loadWeeklyCard()
    setState((prev) => replaceActiveWeek(applyFetchedCard(prev, nextCard), nextCard))
    setDismissedRebets([])
    setActiveMarket('team_to_score')
    setCardLoading(false)
    setFlash(`Fixtures reloaded · card v${nextCard.cardVersion}`)
  }

  function fullReset() {
    const next = hardResetState(state.defaultStake, getActiveCard())
    setState(next)
    setDismissedRebets([])
    setActiveMarket('team_to_score')
    setFlash('Full reset · fresh slips + empty results')
  }

  function setScore(key: string, home: number, away: number) {
    setState((prev) => ({
      ...prev,
      scores: { ...(prev.scores ?? {}), [key]: { home, away } },
    }))
  }

  function clearScore(key: string) {
    setState((prev) => {
      const next = { ...(prev.scores ?? {}) }
      delete next[key]
      return { ...prev, scores: next }
    })
  }

  function applyScores() {
    if (!week) return
    const map = state.scores ?? {}
    if (!Object.keys(map).length) {
      setFlash('Save at least one FT score first')
      return
    }
    setState((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) => {
        if (w.weekKey !== week.weekKey) return w
        return { ...w, slips: applyScoresToSlips(w.slips, map) }
      }),
    }))
    setFlash('Legs settled from FT scores')
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
              Three MIX tiers (Safe / Value / Moonshot) scored by expected value — each shows hit
              chance and EV return. FT scores settle TTS / O1.5 / U4.5 / DC / AH / SW.
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
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void reloadFixtures()}
              disabled={cardLoading}
            >
              Reload fixtures
            </button>
            <button type="button" className="btn" onClick={newWeek}>
              New week
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearResultsOnly}>
              Clear results
            </button>
            <button type="button" className="btn btn-danger" onClick={fullReset}>
              Full reset
            </button>
          </div>
        </div>
        {flash && <div className="flash-banner">{flash}</div>}
      </header>

      <div className="layout">
        <section className="panel">
          <div className="panel-head">
            <h2>{week?.label ?? 'Active week'}</h2>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {primarySlips.length}/7 markets · 3 MIX tiers · card v{card.cardVersion || CARD_VERSION}
              {cardLoading ? ' · loading…' : ''}
            </span>
          </div>
          <div className="panel-body">
            <div className="market-tabs">
              {MARKET_ORDER.map((id) => {
                const meta = MARKETS[id]
                const slip =
                  id === 'mixed'
                    ? mixSlips.find((s) => s.mixTier === activeMixTier) ?? mixSlips[0]
                    : slips.find((s) => s.marketId === id && !s.rebetOf)
                const won = slip?.legs.filter((l) => l.result === 'won').length ?? 0
                const lost = slip?.legs.filter((l) => l.result === 'lost').length ?? 0
                return (
                  <button
                    key={id}
                    type="button"
                    className={`market-tab ${activeMarket === id ? 'active' : ''}`}
                    style={{ ['--accent' as string]: meta.color }}
                    onClick={() => setActiveMarket(id)}
                  >
                    <strong>{meta.shortLabel}</strong>
                    <small>
                      {id === 'mixed'
                        ? mixSlips.length
                          ? `${mixSlips.length} tiers`
                          : '—'
                        : slip
                          ? `${slip.legs.length} legs`
                          : '—'}
                      {won + lost > 0 ? ` · ${won}W/${lost}L` : ''}
                    </small>
                  </button>
                )
              })}
            </div>

            <p className="check-hint">
              Self-check: enter <strong>FT scores</strong> on the right and Apply, or mark each leg{' '}
              <strong>W</strong> / <strong>L</strong> / <strong>V</strong> manually.
            </p>

            {activeSlip ? (
              <>
                {activeMarket === 'mixed' && mixSlips.length > 0 && (
                  <div className="mix-tier-tabs">
                    {MIX_TIER_CONFIGS.map((tier) => {
                      const tierSlip = mixSlips.find((s) => s.mixTier === tier.tier)
                      if (!tierSlip) return null
                      return (
                        <button
                          key={tier.tier}
                          type="button"
                          className={`mix-tier-tab ${activeMixTier === tier.tier ? 'active' : ''}`}
                          onClick={() => setActiveMixTier(tier.tier)}
                        >
                          <strong>{tier.label}</strong>
                          <small>{tierSlip.legs.length} legs</small>
                        </button>
                      )
                    })}
                  </div>
                )}
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
              <p className="empty">No slip for this market. Click Reload fixtures.</p>
            )}
          </div>
        </section>

        <aside className="side-stack">
          <ScoresPanel
            slips={slips}
            scores={scores}
            onSetScore={setScore}
            onClearScore={clearScore}
            onApplyScores={applyScores}
          />
          <ResultsBoard slips={slips} onJumpMarket={setActiveMarket} />
          <RebetPanel
            suggestions={suggestions}
            onAccept={acceptRebet}
            onDismiss={(id) => setDismissedRebets((prev) => [...prev, id])}
          />
          <RankingsPanel stats={stats} bestId={topMarket} />
        </aside>
      </div>

      <p className="footer-note">
        Live:{' '}
        <a href={liveUrl} target="_blank" rel="noreferrer">
          {liveUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </a>
        {' · '}
        Card v{card.cardVersion || CARD_VERSION}. <strong>Reload fixtures</strong> after card
        updates. Not betting advice.
      </p>
    </div>
  )
}
