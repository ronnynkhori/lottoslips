import type {
  CardLegDraft,
  Leg,
  MarketId,
  Slip,
  WeekBundle,
  WeeklyCard,
} from '../types'
import {
  MIX_VALUE_RULES,
  SW_VALUE_RULES,
  mixPayoutScore,
  passesValueRules,
  valueEdge,
  valueScore,
} from '../lib/value'
import fallbackCard from './currentCard.json'
import { MARKET_ORDER } from './markets'

export { CARD_VERSION, MARKETS, MARKET_ORDER } from './markets'
export type { WeeklyCard }

const CARD_URL = `${import.meta.env.BASE_URL}cards/current.json`


function toLeg(draft: CardLegDraft): Leg {
  return {
    id: crypto.randomUUID(),
    kickoff: draft.kickoff,
    home: draft.home,
    away: draft.away,
    competition: draft.competition,
    selection: draft.selection,
    probability: draft.probability,
    odds: Number(draft.odds) > 1 ? Number(draft.odds) : oddsFromProb(draft.probability),
    settleKind: draft.settleKind,
    scoringSide: draft.scoringSide,
    winSide: draft.winSide,
    dcSide: draft.dcSide,
    handicapLine: draft.handicapLine,
    handicapSide: draft.handicapSide,
    result: 'pending',
  }
}

export function oddsFromProb(probability: number): number {
  const p = Math.min(99, Math.max(50, probability))
  const fair = 100 / p
  return Math.max(1.15, Math.round(fair * 0.9 * 100) / 100)
}

function fixtureKey(leg: Pick<Leg, 'kickoff' | 'home' | 'away'>): string {
  return `${leg.kickoff}|${leg.home}|${leg.away}`
}

function sortByValueThenKickoff(a: Leg, b: Leg): number {
  return (
    valueScore(b.probability, b.odds) - valueScore(a.probability, a.odds) ||
    b.odds - a.odds ||
    new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  )
}

function dedupeOnePerFixture(legs: Leg[]): Leg[] {
  const seen = new Set<string>()
  const out: Leg[] = []
  for (const leg of legs) {
    const key = fixtureKey(leg)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(leg)
  }
  return out
}

function dedupeBestPerFixture(legs: Leg[], scoreFn: (leg: Leg) => number): Leg[] {
  const map = new Map<string, Leg>()
  for (const leg of legs) {
    const key = fixtureKey(leg)
    const existing = map.get(key)
    if (!existing || scoreFn(leg) > scoreFn(existing)) {
      map.set(key, leg)
    }
  }
  return [...map.values()]
}

/** Pool every market on the card — prioritise handicap + juicy prices for MIX */
function buildValueMixSlip(card: WeeklyCard, stake: number, createdAt: string): Slip | null {
  const pool = MARKET_ORDER.filter((id) => id !== 'mixed').flatMap((marketId) => {
    const draft = card.markets[marketId]
    if (!draft?.legs?.length) return []
    return draft.legs.map(toLeg)
  })

  const score = (leg: Leg) => mixPayoutScore(leg.probability, leg.odds, leg.settleKind)

  const eligible = pool.filter((l) => passesValueRules(l.probability, l.odds, MIX_VALUE_RULES))

  const bestPerFixture = dedupeBestPerFixture(eligible, score).sort(
    (a, b) => score(b) - score(a) || b.odds - a.odds,
  )

  const handicapFirst = [
    ...bestPerFixture.filter((l) => l.settleKind === 'handicap'),
    ...bestPerFixture.filter((l) => l.settleKind !== 'handicap'),
  ]
  const legs = dedupeOnePerFixture(handicapFirst).slice(0, 22)

  if (!legs.length) return null

  const avgOdds = legs.reduce((s, l) => s + l.odds, 0) / legs.length
  const combined = legs.reduce((s, l) => s * l.odds, 1)
  const hcCount = legs.filter((l) => l.settleKind === 'handicap').length

  return {
    id: crypto.randomUUID(),
    marketId: 'mixed',
    title: `Payout mix · ${legs.length}-fold`,
    description: `Handicap-heavy value acca (${hcCount} AH legs · 68%+ · odds 1.38+). Avg @${avgOdds.toFixed(2)} · combined ~${combined >= 1000 ? `${(combined / 1000).toFixed(1)}k` : combined.toFixed(0)}x`,
    createdAt,
    weekKey: card.weekKey,
    stake,
    status: 'open',
    legs,
  }
}

export function createSlipsFromCard(card: WeeklyCard, stake: number): Slip[] {
  const createdAt = new Date().toISOString()
  const weekKey = card.weekKey

  const standard = MARKET_ORDER.filter((id) => id !== 'mixed').flatMap((marketId) => {
    const draft = card.markets[marketId]
    if (!draft?.legs?.length) return []
    let legs = draft.legs.map(toLeg)
    if (marketId === 'straight_win') {
      legs = legs
        .filter((l) => passesValueRules(l.probability, l.odds, SW_VALUE_RULES))
        .sort(sortByValueThenKickoff)
    } else {
      legs = [...legs].sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
      )
    }
    const avgOdds = legs.reduce((s, l) => s + l.odds, 0) / Math.max(1, legs.length)
    const minEdge = legs.length
      ? Math.min(...legs.map((l) => valueEdge(l.probability, l.odds)))
      : 0
    const slip: Slip = {
      id: crypto.randomUUID(),
      marketId,
      title:
        marketId === 'straight_win'
          ? `Value wins · ${legs.length}-fold`
          : draft.title,
      description:
        marketId === 'straight_win'
          ? `Confident 1X2 picks priced with upside (72%+ · odds 1.28+ · min edge ${(minEdge * 100 - 100).toFixed(0)}%). Avg @${avgOdds.toFixed(2)}`
          : draft.description,
      createdAt,
      weekKey,
      stake,
      status: 'open',
      legs,
    }
    return [slip]
  })

  const mix = buildValueMixSlip(card, stake, createdAt)
  return mix ? [...standard, mix] : standard
}

export function createWeekBundleFromCard(card: WeeklyCard, stake = 1): WeekBundle {
  return {
    weekKey: card.weekKey,
    label: card.label,
    createdAt: new Date().toISOString(),
    cardVersion: card.cardVersion,
    slips: createSlipsFromCard(card, stake),
  }
}

export function getFallbackCard(): WeeklyCard {
  return fallbackCard as WeeklyCard
}

/** Fetch external weekly card; falls back to bundled JSON */
export async function loadWeeklyCard(): Promise<WeeklyCard> {
  try {
    const res = await fetch(`${CARD_URL}?v=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const card = (await res.json()) as WeeklyCard
    if (!card?.cardVersion || !card.markets) throw new Error('Invalid card')
    return card
  } catch {
    return getFallbackCard()
  }
}

export function weekLabelFromKey(weekKey: string): string {
  return `Week ${weekKey.split('-W')[1] ?? weekKey}`
}

export function currentWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/** Sync factory used by storage before async card load completes */
export function createWeekBundle(stake = 1): WeekBundle {
  return createWeekBundleFromCard(getFallbackCard(), stake)
}

export function isValidMarketId(id: string): id is MarketId {
  return (MARKET_ORDER as string[]).includes(id)
}
