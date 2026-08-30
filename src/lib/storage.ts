import type { AppState, Slip, WeekBundle, WeeklyCard } from '../types'
import {
  CARD_VERSION,
  createWeekBundle,
  createWeekBundleFromCard,
  currentWeekKey,
  getFallbackCard,
} from '../data/seedSlips'
import { MARKET_ORDER } from '../data/markets'

const STORAGE_KEY = 'lotto-slips-v13'

let activeCard: WeeklyCard = getFallbackCard()

export function getActiveCard(): WeeklyCard {
  return activeCard
}

export function setActiveCard(card: WeeklyCard) {
  activeCard = card
}

function defaultState(card: WeeklyCard = activeCard): AppState {
  const week = createWeekBundleFromCard(card, 1)
  return {
    weeks: [week],
    activeWeekKey: week.weekKey,
    defaultStake: 1,
    cardVersion: card.cardVersion,
    scores: {},
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.weeks?.length) return defaultState()
    return migrateIfStale(parsed)
  } catch {
    return defaultState()
  }
}

/** Replace active week when fixture card version is behind */
export function migrateIfStale(state: AppState, card: WeeklyCard = activeCard): AppState {
  const targetVersion = Math.max(CARD_VERSION, card.cardVersion)
  const active = state.weeks.find((w) => w.weekKey === state.activeWeekKey) ?? state.weeks[0]
  const hasAllMarkets = MARKET_ORDER.every((id) =>
    active?.slips?.some((s) => s.marketId === id && !s.rebetOf),
  )
  const stale =
    (state.cardVersion ?? 0) < targetVersion ||
    (active?.cardVersion ?? 0) < targetVersion ||
    !hasAllMarkets ||
    !active?.slips?.some((s) => s.legs.some((l) => l.competition)) ||
    !active?.slips?.some((s) => s.legs.some((l) => typeof l.odds === 'number' && l.odds > 1)) ||
    !active?.slips?.some((s) => s.legs.some((l) => Boolean(l.settleKind)))

  if (!stale) {
    return {
      ...state,
      cardVersion: targetVersion,
      scores: state.scores ?? {},
    }
  }

  const fresh = createWeekBundleFromCard(card, state.defaultStake || 1)
  return {
    weeks: [fresh, ...state.weeks.filter((w) => w.weekKey !== fresh.weekKey)],
    activeWeekKey: fresh.weekKey,
    defaultStake: state.defaultStake || 1,
    cardVersion: targetVersion,
    scores: {},
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearStoredState() {
  localStorage.removeItem(STORAGE_KEY)
}

export function hardResetState(stake = 1, card: WeeklyCard = activeCard): AppState {
  clearStoredState()
  const next = defaultState(card)
  next.defaultStake = stake
  next.weeks[0].slips = next.weeks[0].slips.map((s) => ({ ...s, stake }))
  saveState(next)
  return next
}

export function ensureActiveWeek(state: AppState, card: WeeklyCard = activeCard): AppState {
  const migrated = migrateIfStale(state, card)
  const key = card.weekKey || currentWeekKey()
  if (migrated.weeks.some((w) => w.weekKey === key || w.weekKey.startsWith(`${key}-`))) {
    return {
      ...migrated,
      activeWeekKey: migrated.activeWeekKey || key,
      cardVersion: Math.max(CARD_VERSION, card.cardVersion),
      scores: migrated.scores ?? {},
    }
  }
  const week = createWeekBundleFromCard(card, migrated.defaultStake)
  return {
    ...migrated,
    weeks: [week, ...migrated.weeks],
    activeWeekKey: week.weekKey,
    cardVersion: Math.max(CARD_VERSION, card.cardVersion),
    scores: migrated.scores ?? {},
  }
}

/** After async card fetch: refresh if newer card */
export function applyFetchedCard(state: AppState, card: WeeklyCard): AppState {
  setActiveCard(card)
  return ensureActiveWeek(migrateIfStale(state, card), card)
}

export function updateSlipInState(
  state: AppState,
  weekKey: string,
  slipId: string,
  updater: (slip: Slip) => Slip,
): AppState {
  return {
    ...state,
    weeks: state.weeks.map((week) => {
      if (week.weekKey !== weekKey) return week
      return {
        ...week,
        slips: week.slips.map((s) => (s.id === slipId ? updater(s) : s)),
      }
    }),
  }
}

export function addSlipToWeek(state: AppState, weekKey: string, slip: Slip): AppState {
  return {
    ...state,
    weeks: state.weeks.map((week) => {
      if (week.weekKey !== weekKey) return week
      return { ...week, slips: [...week.slips, slip] }
    }),
  }
}

export function getActiveWeek(state: AppState): WeekBundle | undefined {
  return state.weeks.find((w) => w.weekKey === state.activeWeekKey) ?? state.weeks[0]
}

export function replaceActiveWeek(state: AppState, card: WeeklyCard = activeCard): AppState {
  const fresh = createWeekBundleFromCard(card, state.defaultStake)
  const key = `${fresh.weekKey}-${Date.now()}`
  const week = {
    ...fresh,
    weekKey: key,
    label: `${fresh.label} · refreshed`,
    slips: fresh.slips.map((s) => ({ ...s, weekKey: key, stake: state.defaultStake })),
  }
  return {
    ...state,
    weeks: [week, ...state.weeks],
    activeWeekKey: key,
    cardVersion: Math.max(CARD_VERSION, card.cardVersion),
    scores: {},
  }
}

export function createNewWeek(state: AppState, card: WeeklyCard = activeCard): AppState {
  const weekBundle = createWeekBundleFromCard(card, state.defaultStake)
  const key = `${weekBundle.weekKey}-${Date.now()}`
  const next = {
    ...weekBundle,
    weekKey: key,
    label: `${weekBundle.label} (new)`,
    slips: weekBundle.slips.map((s) => ({
      ...s,
      weekKey: key,
      stake: state.defaultStake,
    })),
  }
  return {
    ...state,
    weeks: [next, ...state.weeks],
    activeWeekKey: key,
    cardVersion: Math.max(CARD_VERSION, card.cardVersion),
    scores: {},
  }
}

// Keep sync createWeekBundle export path happy for any leftover callers
export { createWeekBundle }
