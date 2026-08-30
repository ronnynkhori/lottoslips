import type { MarketId, MarketMeta } from '../types'

/** Bump when the fixture card schema/markets change; card JSON has its own version */
export const CARD_VERSION = 12

export const MARKETS: Record<MarketId, MarketMeta> = {
  team_to_score: {
    id: 'team_to_score',
    label: 'Underdog TTS',
    shortLabel: 'TTS',
    color: '#1fa97a',
  },
  over_1_5: {
    id: 'over_1_5',
    label: 'Over 1.5 Goals',
    shortLabel: 'O1.5',
    color: '#e8a317',
  },
  under_4_5: {
    id: 'under_4_5',
    label: 'Under 4.5 Goals',
    shortLabel: 'U4.5',
    color: '#3d8bfd',
  },
  double_chance: {
    id: 'double_chance',
    label: 'Double Chance',
    shortLabel: 'DC',
    color: '#e85d4c',
  },
  straight_win: {
    id: 'straight_win',
    label: 'Straight Win',
    shortLabel: 'SW',
    color: '#f472b6',
  },
  mixed: {
    id: 'mixed',
    label: 'Mixed 85+',
    shortLabel: 'MIX',
    color: '#c084fc',
  },
}

export const MARKET_ORDER: MarketId[] = [
  'team_to_score',
  'over_1_5',
  'under_4_5',
  'double_chance',
  'straight_win',
  'mixed',
]
