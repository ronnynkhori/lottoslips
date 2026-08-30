import { MARKETS, MARKET_ORDER } from '../data/markets'
import type { Leg, MarketId, MarketStats, Slip, WeekBundle } from '../types'

export function slipLegSummary(slip: Slip) {
  const won = slip.legs.filter((l) => l.result === 'won').length
  const lost = slip.legs.filter((l) => l.result === 'lost').length
  const voided = slip.legs.filter((l) => l.result === 'void').length
  const pending = slip.legs.filter((l) => l.result === 'pending').length
  const settled = won + lost + voided
  const dead = lost > 0
  const complete = pending === 0
  const fullHit = complete && lost === 0 && won > 0
  return { won, lost, voided, pending, settled, dead, complete, fullHit }
}

export function earliestPendingLegs(slip: Slip, count = 2): Leg[] {
  return [...slip.legs]
    .filter((l) => l.result === 'pending')
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    .slice(0, count)
}

export function chronologicalLegs(slip: Slip): Leg[] {
  return [...slip.legs].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  )
}

/** First N legs by kickoff that are already settled (won/lost/void) */
export function firstSettledLegs(slip: Slip, n = 2): Leg[] {
  return chronologicalLegs(slip)
    .filter((l) => l.result !== 'pending')
    .slice(0, n)
}

export function legOdds(leg: Leg): number {
  if (leg.odds && leg.odds > 1) return leg.odds
  const p = Math.min(0.95, Math.max(0.5, leg.probability / 100))
  return 1 / p
}

export function estimateCombinedOdds(legs: Leg[]): number {
  return legs.reduce((acc, leg) => {
    if (leg.result === 'void') return acc
    return acc * legOdds(leg)
  }, 1)
}

export function potentialReturn(slip: Slip): number {
  if (slip.legs.some((l) => l.result === 'lost')) return 0
  const active = slip.legs.filter((l) => l.result === 'pending' || l.result === 'won')
  return Number((slip.stake * estimateCombinedOdds(active)).toFixed(2))
}

/**
 * Rank markets on odds-backed ROI first (once enough settled slips),
 * otherwise on leg hit-rate vs average odds (rough CLV proxy).
 */
export function computeMarketStats(weeks: WeekBundle[]): MarketStats[] {
  const allSlips = weeks.flatMap((w) => w.slips)

  return MARKET_ORDER.map((marketId) => {
    const slips = allSlips.filter((s) => s.marketId === marketId && !s.rebetOf)
    const rebets = allSlips.filter((s) => s.marketId === marketId && s.rebetOf)
    const pool = [...slips, ...rebets]

    let legsPlayed = 0
    let legsWon = 0
    let unitsStaked = 0
    let unitsReturned = 0
    let settledSlips = 0
    let fullHits = 0
    let oddsSum = 0

    for (const slip of pool) {
      const summary = slipLegSummary(slip)
      const playedLegs = slip.legs.filter((l) => l.result === 'won' || l.result === 'lost')
      legsPlayed += playedLegs.length
      legsWon += playedLegs.filter((l) => l.result === 'won').length
      oddsSum += playedLegs.reduce((s, l) => s + legOdds(l), 0)

      if (summary.complete) {
        settledSlips += 1
        unitsStaked += slip.stake
        if (summary.fullHit) {
          fullHits += 1
          unitsReturned += slip.stake * estimateCombinedOdds(slip.legs)
        }
      }
    }

    const legHitRate = legsPlayed ? (legsWon / legsPlayed) * 100 : 0
    const slipHitRate = settledSlips ? (fullHits / settledSlips) * 100 : 0
    const roi = unitsStaked ? ((unitsReturned - unitsStaked) / unitsStaked) * 100 : 0
    const avgOdds = legsPlayed ? oddsSum / legsPlayed : 0

    // Expected leg win% from avg odds (ignore void); positive edge → hit rate > 1/avgOdds
    const impliedWinPct = avgOdds > 1 ? (1 / avgOdds) * 100 : 0
    const edgePts = legsPlayed >= 5 ? legHitRate - impliedWinPct : 0

    // Prefer ROI once ≥2 slips settled; else edge vs odds + reliability
    const rankScore =
      settledSlips >= 2
        ? Math.min(100, Math.max(0, 50 + roi / 2)) * 0.55 +
          Math.min(100, Math.max(0, 50 + edgePts * 2)) * 0.25 +
          slipHitRate * 0.2
        : Math.min(100, Math.max(0, 50 + edgePts * 2)) * 0.45 +
          legHitRate * 0.4 +
          Math.min(100, Math.max(0, 50 + roi / 2)) * 0.15

    return {
      marketId,
      label: MARKETS[marketId].label,
      slips: pool.length,
      settledSlips,
      fullHits,
      slipHitRate,
      legsPlayed,
      legsWon,
      legHitRate,
      unitsStaked,
      unitsReturned,
      roi,
      avgOdds,
      rankScore,
    }
  }).sort((a, b) => b.rankScore - a.rankScore)
}

export function bestMarket(weeks: WeekBundle[]): MarketId | null {
  const stats = computeMarketStats(weeks).filter((s) => s.legsPlayed >= 5)
  return stats[0]?.marketId ?? null
}
