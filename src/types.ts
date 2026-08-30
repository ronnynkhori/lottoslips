export type MarketId =
  | 'team_to_score'
  | 'over_1_5'
  | 'under_4_5'
  | 'double_chance'
  | 'mixed'

export type LegResult = 'pending' | 'won' | 'lost' | 'void'

export type DoubleChanceSide = '1X' | 'X2' | '12'

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
  /** Optional decimal odds */
  odds?: number
  result: LegResult
  /** For double chance market */
  dcSide?: DoubleChanceSide
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

export interface AppState {
  weeks: WeekBundle[]
  activeWeekKey: string
  defaultStake: number
  cardVersion?: number
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
