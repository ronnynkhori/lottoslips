import type { AppState, Slip, WeekBundle } from '../types'
import { CARD_VERSION, createWeekBundle, currentWeekKey } from '../data/seedSlips'

const STORAGE_KEY = 'lotto-slips-v8'

function defaultState(): AppState {
  const week = createWeekBundle(1)
  return {
    weeks: [week],
    activeWeekKey: week.weekKey,
    defaultStake: 1,
    cardVersion: CARD_VERSION,
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
export function migrateIfStale(state: AppState): AppState {
  const active = state.weeks.find((w) => w.weekKey === state.activeWeekKey) ?? state.weeks[0]
  const stale =
    (state.cardVersion ?? 0) < CARD_VERSION ||
    (active?.cardVersion ?? 0) < CARD_VERSION ||
    !active?.slips?.some((s) => s.legs.some((l) => l.competition))

  if (!stale) {
    return { ...state, cardVersion: CARD_VERSION }
  }

  const fresh = createWeekBundle(state.defaultStake || 1)
  return {
    weeks: [fresh, ...state.weeks.filter((w) => w.weekKey !== fresh.weekKey)],
    activeWeekKey: fresh.weekKey,
    defaultStake: state.defaultStake || 1,
    cardVersion: CARD_VERSION,
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearStoredState() {
  localStorage.removeItem(STORAGE_KEY)
}

export function hardResetState(stake = 1): AppState {
  clearStoredState()
  const next = defaultState()
  next.defaultStake = stake
  next.weeks[0].slips = next.weeks[0].slips.map((s) => ({ ...s, stake }))
  saveState(next)
  return next
}

export function ensureActiveWeek(state: AppState): AppState {
  const migrated = migrateIfStale(state)
  const key = currentWeekKey()
  if (migrated.weeks.some((w) => w.weekKey === key || w.weekKey.startsWith(`${key}-`))) {
    return {
      ...migrated,
      activeWeekKey: migrated.activeWeekKey || key,
      cardVersion: CARD_VERSION,
    }
  }
  const week = createWeekBundle(migrated.defaultStake)
  return {
    ...migrated,
    weeks: [week, ...migrated.weeks],
    activeWeekKey: week.weekKey,
    cardVersion: CARD_VERSION,
  }
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

export function replaceActiveWeek(state: AppState): AppState {
  const fresh = createWeekBundle(state.defaultStake)
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
    cardVersion: CARD_VERSION,
  }
}
