/** Short labels for leg market types in MIX / value slips */
export const SETTLE_KIND_LABEL: Record<string, string> = {
  team_to_score: 'TTS',
  over_1_5: 'O1.5',
  under_4_5: 'U4.5',
  double_chance: 'DC',
  handicap: 'AH',
  straight_win: '1X2',
}

export function settleKindLabel(settleKind: string): string {
  return SETTLE_KIND_LABEL[settleKind] ?? settleKind
}
