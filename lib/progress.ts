const KEY = 'quem-sou-eu:completed'
const RESULTS_KEY = 'quem-sou-eu:results'

export type GameResult = {
  date: string
  won: boolean
  questions: number
  mode: 'daily' | 'free'
}

export function getCompletedDays(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function markDayCompleted(date: string): void {
  if (typeof window === 'undefined') return
  const days = getCompletedDays()
  if (!days.includes(date)) {
    days.push(date)
    localStorage.setItem(KEY, JSON.stringify(days))
  }
}

export function isDayCompleted(date: string): boolean {
  return getCompletedDays().includes(date)
}

export function getResults(): GameResult[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY) ?? '[]') as GameResult[]
  } catch {
    return []
  }
}

export function saveResult(result: GameResult): void {
  if (typeof window === 'undefined') return
  const results = getResults()
  const existingIndex = results.findIndex(
    r => r.date === result.date && r.mode === result.mode
  )
  if (existingIndex >= 0) {
    results[existingIndex] = result
  } else {
    results.push(result)
  }
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results))
}

export function getStreak(): number {
  const results = getResults()
  const wonDays = results
    .filter(r => r.mode === 'daily' && r.won)
    .map(r => r.date)
    .sort()
    .reverse()

  if (wonDays.length === 0) return 0

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // Streak só conta se o mais recente for hoje ou ontem
  if (wonDays[0] !== today && wonDays[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < wonDays.length; i++) {
    const prev = new Date(wonDays[i - 1])
    const curr = new Date(wonDays[i])
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function getTodayResult(): GameResult | null {
  const today = new Date().toISOString().slice(0, 10)
  return getResults().find(r => r.mode === 'daily' && r.date === today) ?? null
}
