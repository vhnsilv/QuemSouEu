import { NextResponse } from 'next/server'
import calendarData from '../../../data/calendar-2026.json'
import entitiesData from '../../../data/entities.json'

type Entity = { nome: string; categoria: string; dificuldade: string }

const calendar = calendarData as Record<string, string>
const entityMap = new Map((entitiesData as Entity[]).map(e => [e.nome, e]))

export type CalendarDay = {
  date: string
  categoria: string
  dificuldade: string
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)
  const start = new Date('2026-01-01T00:00:00Z')
  const todayDate = new Date(today + 'T00:00:00Z')

  const days: CalendarDay[] = []
  for (let d = new Date(start); d <= todayDate; d = new Date(d.getTime() + 86400_000)) {
    const date = d.toISOString().slice(0, 10)
    const name = calendar[date]
    const entity = name ? entityMap.get(name) : undefined
    days.push({
      date,
      categoria: entity?.categoria ?? 'desconhecido',
      dificuldade: entity?.dificuldade ?? 'desconhecido',
    })
  }

  // Mais recente primeiro
  days.reverse()

  return NextResponse.json(days, {
    headers: { 'Cache-Control': 'public, s-maxage=3600' },
  })
}
