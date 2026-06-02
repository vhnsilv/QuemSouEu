'use client'

import { useEffect, useState } from 'react'
import { getCompletedDays } from '../../lib/progress'
import type { CalendarDay } from '../api/calendar/route'

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const DIFICULDADE_BADGE: Record<string, string> = {
  'fácil': 'bg-emerald-900/50 text-emerald-400',
  'médio': 'bg-amber-900/50 text-amber-400',
  'difícil': 'bg-rose-900/50 text-rose-400',
}

type Props = {
  onSelect: (date: string) => void
  onBack: () => void
}

export default function CalendarPicker({ onSelect, onBack }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [days, setDays] = useState<CalendarDay[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCompleted(getCompletedDays())
    fetch('/api/calendar')
      .then(r => r.json())
      .then((data: CalendarDay[]) => setDays(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0a1e] text-[#f0eeff]">
      <header className="flex items-center gap-4 px-4 sm:px-6 py-4 bg-[#1a1433] border-b border-[#352a60]">
        <button
          onClick={onBack}
          className="text-[#9d8ec8] hover:text-[#f0eeff] transition-colors text-sm px-2 min-h-[44px]"
        >
          ← Voltar
        </button>
        <div>
          <h1 className="text-xl font-bold">Dias anteriores</h1>
          {!loading && (
            <p className="text-xs text-[#9d8ec8]">{completed.length} de {days.length} concluídos</p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && (
          <p className="text-center text-[#352a60] mt-12">Carregando...</p>
        )}

        {!loading && days.map(({ date, categoria, dificuldade }) => {
          const isToday = date === today
          const isDone = completed.includes(date)
          const d = new Date(date + 'T00:00:00Z')
          const label = `${DIAS_PT[d.getUTCDay()]}, ${d.getUTCDate()} ${MESES_PT[d.getUTCMonth()]}`

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left min-h-[56px]
                ${isToday
                  ? 'bg-gradient-to-br from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 shadow-lg shadow-violet-900/40'
                  : 'bg-[#1a1433] border border-[#352a60] hover:bg-[#241c45]'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {isToday ? '📅 Hoje' : label}
                  </span>
                  {!isToday && (
                    <span className="text-xs text-[#9d8ec8]">{date}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`capitalize ${isToday ? 'text-indigo-200' : 'text-[#9d8ec8]'}`}>
                    {categoria}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded font-medium ${DIFICULDADE_BADGE[dificuldade] ?? 'bg-[#241c45] text-[#9d8ec8]'}`}>
                    {dificuldade}
                  </span>
                </div>
              </div>

              {isDone && (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Feito
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
