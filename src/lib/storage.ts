import type { AppState, Slip, WeekBundle } from '../types'
import { createWeekBundle, currentWeekKey } from '../data/seedSlips'

const STORAGE_KEY = 'lotto-slips-v3'

function defaultState(): AppState {
  const week = createWeekBundle(1)
  return {
    weeks: [week],
    activeWeekKey: week.weekKey,
    defaultStake: 1,
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.weeks?.length) return defaultState()
    return parsed
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function ensureActiveWeek(state: AppState): AppState {
  const key = currentWeekKey()
  if (state.weeks.some((w) => w.weekKey === key)) {
    return { ...state, activeWeekKey: state.activeWeekKey || key }
  }
  const week = createWeekBundle(state.defaultStake)
  return {
    ...state,
    weeks: [week, ...state.weeks],
    activeWeekKey: week.weekKey,
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
