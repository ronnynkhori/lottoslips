import type {
  CardLegDraft,
  Leg,
  MarketId,
  SettleKind,
  Slip,
  WeekBundle,
  WeeklyCard,
} from '../types'
import {
  MIX_TIER_CONFIGS,
  MIX_DIVERSITY,
  SW_VALUE_RULES,
  mixTierScore,
  passesMixRules,
  passesValueRules,
  valueEdge,
  valueScore,
  type MixTierConfig,
} from '../lib/value'
import {
  accaCombinedOdds,
  accaExpectedReturn,
  accaHitProbability,
  formatCombinedOdds,
  formatHitChance,
} from '../lib/stats'
import fallbackCard from './currentCard.json'
import { MARKET_ORDER } from './markets'

export { CARD_VERSION, MARKETS, MARKET_ORDER } from './markets'
export { MIX_TIER_CONFIGS } from '../lib/value'
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

function applyCompetitionCap(legs: Leg[], maxPerCompetition: number): Leg[] {
  const counts = new Map<string, number>()
  const out: Leg[] = []
  for (const leg of legs) {
    const comp = leg.competition?.trim() || 'Other'
    const n = counts.get(comp) ?? 0
    if (n >= maxPerCompetition) continue
    counts.set(comp, n + 1)
    out.push(leg)
  }
  return out
}

function buildMixPool(card: WeeklyCard): Leg[] {
  return MARKET_ORDER.filter((id) => id !== 'mixed').flatMap((marketId) => {
    const draft = card.markets[marketId]
    if (!draft?.legs?.length) return []
    return draft.legs.map(toLeg)
  })
}

function selectMixLegs(pool: Leg[], config: MixTierConfig): Leg[] {
  const diversity = MIX_DIVERSITY[config.tier]
  const score = (leg: Leg) =>
    mixTierScore(leg.probability, leg.odds, config.payoutBias)

  const eligible = pool.filter((l) => passesMixRules(l.probability, l.odds, l.settleKind, config))

  const picked: Leg[] = []
  const usedFixtures = new Set<string>()
  const kindCounts = new Map<SettleKind, number>()

  const canPick = (leg: Leg): boolean => {
    if (usedFixtures.has(fixtureKey(leg))) return false
    if (
      leg.settleKind === 'handicap' &&
      (kindCounts.get('handicap') ?? 0) >= diversity.maxHandicap
    ) {
      return false
    }
    return true
  }

  const pick = (leg: Leg) => {
    picked.push(leg)
    usedFixtures.add(fixtureKey(leg))
    kindCounts.set(leg.settleKind, (kindCounts.get(leg.settleKind) ?? 0) + 1)
  }

  const byScore = (legs: Leg[]) => [...legs].sort((a, b) => score(b) - score(a) || b.odds - a.odds)

  // Phase 1: hit minimum counts per market type (TTS, O1.5, DC, etc.)
  const minKinds = Object.entries(diversity.minByKind) as [SettleKind, number][]
  for (const [kind, min] of minKinds) {
    if (kind === 'handicap') continue
    for (const leg of byScore(eligible.filter((l) => l.settleKind === kind))) {
      if ((kindCounts.get(kind) ?? 0) >= min) break
      if (!canPick(leg)) continue
      pick(leg)
    }
  }

  // Phase 2: fill remaining slots — best EV/payout, handicap capped
  for (const leg of byScore(eligible)) {
    if (picked.length >= config.legTarget) break
    if (!canPick(leg)) continue
    if (picked.some((p) => p.id === leg.id)) continue
    pick(leg)
  }

  return applyCompetitionCap(picked, config.maxPerCompetition).slice(0, config.legTarget)
}

function buildTieredMixSlips(
  card: WeeklyCard,
  pool: Leg[],
  stake: number,
  createdAt: string,
): Slip[] {
  const weekKey = card.weekKey

  return MIX_TIER_CONFIGS.map((config) => {
    const legs = selectMixLegs(pool, config)
    const hitChance = accaHitProbability(legs)
    const combined = accaCombinedOdds(legs)
    const evReturn = accaExpectedReturn(legs, stake)
    const avgOdds = legs.reduce((s, l) => s + l.odds, 0) / Math.max(1, legs.length)

    return {
      id: crypto.randomUUID(),
      marketId: 'mixed' as const,
      mixTier: config.tier,
      title: `MIX ${config.label} · ${legs.length}-fold`,
      description: `${config.label} mix · TTS/O1.5/DC/AH/1X2 · EV-scored. Hit ~${formatHitChance(hitChance)} · ${formatCombinedOdds(combined)}x · est. return ${evReturn.toFixed(1)} on stake ${stake} · avg @${avgOdds.toFixed(2)}`,
      createdAt,
      weekKey,
      stake,
      status: 'open' as const,
      legs,
    }
  }).filter((s) => s.legs.length > 0)
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

  const mixPool = buildMixPool(card)
  const mixSlips = buildTieredMixSlips(card, mixPool, stake, createdAt)
  return [...standard, ...mixSlips]
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
