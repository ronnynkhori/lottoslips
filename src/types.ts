export type MarketId =
  | 'team_to_score'
  | 'over_1_5'
  | 'under_4_5'
  | 'double_chance'
  | 'handicap'
  | 'straight_win'
  | 'mixed'

export type LegResult = 'pending' | 'won' | 'lost' | 'void'

export type DoubleChanceSide = '1X' | 'X2' | '12'

export type SettleKind =
  | 'team_to_score'
  | 'over_1_5'
  | 'under_4_5'
  | 'double_chance'
  | 'handicap'
  | 'straight_win'

export type ScoringSide = 'home' | 'away'

/** Outright match winner (no draw) */
export type WinSide = 'home' | 'away'

export interface Leg {
  id: string
  kickoff: string // ISO date
  home: string
  away: string
  /** League or cup name */
  competition: string
  /** Display selection text */
  selection: string
  /** Estimated probability 0–100 */
  probability: number
  /** Decimal odds taken (required for ROI) */
  odds: number
  result: LegResult
  /** How result was set */
  resultSource?: 'manual' | 'score'
  /** Settlement rule for this leg */
  settleKind: SettleKind
  /** For TTS: which side must score */
  scoringSide?: ScoringSide
  /** For straight win: which side must win */
  winSide?: WinSide
  /** For double chance market */
  dcSide?: DoubleChanceSide
  /** For Asian handicap: line applied to picked side (e.g. -1, -1.5, +1) */
  handicapLine?: number
  /** Which side receives the handicap line */
  handicapSide?: WinSide
}

export interface Slip {
  id: string
  marketId: MarketId
  title: string
  description: string
  createdAt: string
  weekKey: string
  stake: number
  potentialReturn?: number
  legs: Leg[]
  /** If this slip was created as a rebet of another */
  rebetOf?: string
  status: 'open' | 'settled'
}

export interface MarketMeta {
  id: MarketId
  label: string
  shortLabel: string
  color: string
}

export interface WeekBundle {
  weekKey: string
  label: string
  slips: Slip[]
  createdAt: string
  /** Fixture card version — stale weeks get replaced on load */
  cardVersion?: number
}

/** FT score keyed by fixtureKey(kickoff, home, away) */
export type ScoreMap = Record<string, { home: number; away: number }>

export interface AppState {
  weeks: WeekBundle[]
  activeWeekKey: string
  defaultStake: number
  cardVersion?: number
  /** Shared FT scores for assisted settlement */
  scores?: ScoreMap
}

export interface MarketStats {
  marketId: MarketId
  label: string
  slips: number
  settledSlips: number
  fullHits: number
  slipHitRate: number
  legsPlayed: number
  legsWon: number
  legHitRate: number
  unitsStaked: number
  unitsReturned: number
  roi: number
  /** Average decimal odds on played legs */
  avgOdds: number
  rankScore: number
}

export interface RebetSuggestion {
  slipId: string
  marketId: MarketId
  marketLabel: string
  earlyLost: number
  remainingLegs: Leg[]
  reason: string
  suggestedStake: number
  urgency: 'high' | 'medium'
}

/** Shape of public/cards/current.json */
export interface CardLegDraft {
  kickoff: string
  home: string
  away: string
  competition: string
  selection: string
  probability: number
  odds: number
  settleKind: SettleKind
  scoringSide?: ScoringSide
  winSide?: WinSide
  dcSide?: DoubleChanceSide
  handicapLine?: number
  handicapSide?: WinSide
}

export interface CardMarketDraft {
  title: string
  description: string
  legs: CardLegDraft[]
}

export interface WeeklyCard {
  cardVersion: number
  weekKey: string
  label: string
  updatedAt?: string
  markets: Partial<Record<MarketId, CardMarketDraft>>
}
