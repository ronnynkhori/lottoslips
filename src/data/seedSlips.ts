import type {
  CardLegDraft,
  Leg,
  MarketId,
  Slip,
  WeekBundle,
  WeeklyCard,
} from '../types'
import fallbackCard from './currentCard.json'
import { MARKET_ORDER } from './markets'

export { CARD_VERSION, MARKETS, MARKET_ORDER } from './markets'
export type { WeeklyCard }

const CARD_URL = '/cards/current.json'

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
    result: 'pending',
  }
}

export function oddsFromProb(probability: number): number {
  const p = Math.min(99, Math.max(50, probability))
  const fair = 100 / p
  return Math.max(1.05, Math.round(fair * 0.95 * 100) / 100)
}

export function createSlipsFromCard(card: WeeklyCard, stake: number): Slip[] {
  const createdAt = new Date().toISOString()
  const weekKey = card.weekKey

  return MARKET_ORDER.flatMap((marketId) => {
    const draft = card.markets[marketId]
    if (!draft?.legs?.length) return []
    let legs = draft.legs.map(toLeg)
    if (marketId === 'straight_win') {
      legs = legs
        .filter((l) => l.probability > 80)
        .sort(
          (a, b) =>
            b.probability - a.probability ||
            new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
        )
    } else if (marketId === 'mixed') {
      // One leg per fixture — keep highest probability if duplicates slip in
      legs = [...legs]
        .sort((a, b) => b.probability - a.probability)
        .filter((leg, _i, arr) => {
          const key = `${leg.kickoff}|${leg.home}|${leg.away}`
          return arr.findIndex((x) => `${x.kickoff}|${x.home}|${x.away}` === key) ===
            arr.indexOf(leg)
        })
        .sort(
          (a, b) =>
            b.probability - a.probability ||
            new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
        )
    } else {
      legs = [...legs].sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
      )
    }
    const slip: Slip = {
      id: crypto.randomUUID(),
      marketId,
      title: draft.title,
      description: draft.description,
      createdAt,
      weekKey,
      stake,
      status: 'open',
      legs,
    }
    return [slip]
  })
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
