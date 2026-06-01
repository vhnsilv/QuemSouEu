const KEY = 'quem-sou-eu:completed'

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
