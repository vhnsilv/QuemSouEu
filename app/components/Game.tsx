'use client'

import { useState, useRef, useEffect } from 'react'
import CalendarPicker from './CalendarPicker'
import ResultCard from './ResultCard'
import { markDayCompleted, saveResult, getStreak } from '../../lib/progress'

type QA = { question: string; answer: string }
type GameStatus = 'selecting' | 'calendar' | 'playing' | 'won' | 'lost'
type InvalidWarning = { message: string } | null
type GameMode = 'daily' | 'free'

type GameSession = {
  mode: GameMode
  token: string | null
  date: string | null
  categoria: string
  dificuldade: string
}

const DIFICULDADE_COR: Record<string, string> = {
  'fácil': 'text-emerald-400',
  'médio': 'text-amber-400',
  'difícil': 'text-rose-400',
}

function answerBubbleClass(answer: string): string {
  if (answer === 'Sim')           return 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
  if (answer === 'Não')           return 'bg-rose-900/60 text-rose-300 border border-rose-800'
  if (answer.startsWith('Mais')) return 'bg-amber-900/60 text-amber-300 border border-amber-800'
  if (answer === 'Não sei')       return 'bg-slate-800/60 text-slate-300 border border-slate-700'
  if (answer === 'Errado!')       return 'bg-rose-900/60 text-rose-300 border border-rose-800'
  return 'bg-[#241c45] text-[#9d8ec8] border border-[#352a60]'
}

export default function Game() {
  const [status, setStatus] = useState<GameStatus>('selecting')
  const [session, setSession] = useState<GameSession | null>(null)
  const [qas, setQas] = useState<QA[]>([])
  const [input, setInput] = useState('')
  const [guessMode, setGuessMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [secret, setSecret] = useState('')
  const [warning, setWarning] = useState<InvalidWarning>(null)
  const [streak, setStreak] = useState(0)
  const historyEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setStreak(getStreak())
  }, [])

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qas])

  async function startGame(mode: GameMode, date?: string) {
    setIsLoading(true)
    try {
      const body: Record<string, string> = { mode }
      if (date) body.date = date
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setSession({
        mode,
        token: data.token ?? null,
        date: data.date ?? null,
        categoria: data.categoria,
        dificuldade: data.dificuldade,
      })
      setStatus('playing')
    } catch {
      // stay on selecting screen
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAsk() {
    const q = input.trim()
    if (!q || isLoading || !session) return
    setInput('')
    setWarning(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          mode: session.mode,
          token: session.token,
          date: session.date,
        }),
      })
      const data = await res.json()
      const answer = data.answer ?? 'Não sei'
      if (answer === 'invalida') {
        setWarning({ message: 'Faça uma pergunta de sim/não sobre a entidade! Para adivinhar o nome, use o botão "Fazer chute final".' })
      } else {
        setWarning(null)
        setQas(prev => [...prev, { question: q, answer }])
      }
    } catch {
      setWarning({ message: 'Erro ao obter resposta. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGuess() {
    const guess = input.trim()
    if (!guess || isLoading || !session) return
    setInput('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guess,
          mode: session.mode,
          token: session.token,
          date: session.date,
        }),
      })
      const data = await res.json()
      if (data.correct) {
        setSecret(guess)
        if (session.mode === 'daily' && session.date) {
          markDayCompleted(session.date)
          saveResult({ date: session.date, won: true, questions: qas.length, mode: 'daily' })
        } else if (session.mode === 'free') {
          saveResult({ date: 'free', won: true, questions: qas.length, mode: 'free' })
        }
        setStreak(getStreak())
        setStatus('won')
      } else {
        if (data.secret) setSecret(data.secret)
        setQas(prev => [...prev, { question: `Chute: "${guess}"`, answer: 'Errado!' }])
        if (session.mode === 'daily' && session.date) {
          markDayCompleted(session.date)
          saveResult({ date: session.date, won: false, questions: qas.length + 1, mode: 'daily' })
        } else if (session.mode === 'free') {
          saveResult({ date: 'free', won: false, questions: qas.length + 1, mode: 'free' })
        }
        setStatus('lost')
      }
    } catch {
      setQas(prev => [...prev, { question: `Chute: "${guess}"`, answer: 'Erro ao verificar. Tente novamente.' }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      guessMode ? handleGuess() : handleAsk()
    }
  }

  function handleRestart() {
    setQas([])
    setInput('')
    setGuessMode(false)
    setStatus('selecting')
    setSession(null)
    setSecret('')
    setWarning(null)
    setStreak(getStreak())
  }

  if (status === 'calendar') {
    return (
      <CalendarPicker
        onSelect={date => startGame('daily', date)}
        onBack={() => setStatus('selecting')}
      />
    )
  }

  if (status === 'selecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6 bg-[#0d0a1e]">
        <div className="text-center space-y-2 animate-fade-up">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Quem Sou Eu?
          </h1>
          <p className="text-[#9d8ec8] text-sm">
            Descubra a entidade secreta fazendo perguntas de sim/não.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs animate-fade-up">
          <button
            onClick={() => startGame('daily')}
            disabled={isLoading}
            className="flex flex-col items-center gap-1 px-6 py-5 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 rounded-2xl font-semibold transition-all shadow-lg shadow-violet-900/50"
          >
            <span className="text-2xl">📅</span>
            <span className="text-lg">Desafio do Dia</span>
            <span className="text-xs text-violet-200 font-normal">A mesma entidade para todo mundo</span>
          </button>

          <button
            onClick={() => setStatus('calendar')}
            disabled={isLoading}
            className="flex flex-col items-center gap-1 px-6 py-5 bg-[#241c45] border border-[#352a60] hover:bg-[#2d2255] disabled:opacity-50 rounded-2xl font-semibold transition-all text-[#f0eeff]"
          >
            <span className="text-2xl">🗓️</span>
            <span className="text-lg">Dias anteriores</span>
            <span className="text-xs text-[#9d8ec8] font-normal">Recupere desafios que perdeu</span>
          </button>

          <button
            onClick={() => startGame('free')}
            disabled={isLoading}
            className="flex flex-col items-center gap-1 px-6 py-5 bg-[#241c45] border border-[#352a60] hover:bg-[#2d2255] disabled:opacity-50 rounded-2xl font-semibold transition-all text-[#f0eeff]"
          >
            <span className="text-2xl">🎲</span>
            <span className="text-lg">Modo Livre</span>
            <span className="text-xs text-[#9d8ec8] font-normal">Entidade aleatória para treinar</span>
          </button>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-900/30 border border-orange-800/50 rounded-full">
            <span className="text-orange-400 text-sm font-semibold">
              🔥 Sequência: {streak} dia{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {isLoading && <p className="text-[#9d8ec8] text-sm">Carregando...</p>}
      </div>
    )
  }

  if (status === 'won' || status === 'lost') {
    const validAnswers = qas
      .filter(qa => !qa.question.startsWith('Chute:'))
      .map(qa => qa.answer)
    return (
      <ResultCard
        won={status === 'won'}
        questions={validAnswers.length}
        answers={validAnswers}
        mode={session?.mode ?? 'free'}
        date={session?.date ?? null}
        streak={streak}
        secret={secret}
        onRestart={handleRestart}
      />
    )
  }

  const isHistoricalDay = session?.mode === 'daily' && session.date !== new Date().toISOString().slice(0, 10)

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0a1e] text-[#f0eeff]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#1a1433] border-b border-[#352a60]">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Quem Sou Eu?
          </h1>
          {session && (
            <p className="text-xs text-[#9d8ec8] mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                session.mode === 'daily'
                  ? 'bg-indigo-900/60 text-indigo-300'
                  : 'bg-orange-900/60 text-orange-300'
              }`}>
                {session.mode === 'daily'
                  ? isHistoricalDay ? `🗓️ ${session.date}` : '📅 Desafio do Dia'
                  : '🎲 Modo Livre'}
              </span>
              <span className="capitalize">{session.categoria}</span>
              <span className="text-[#352a60]">·</span>
              <span className={`font-medium ${DIFICULDADE_COR[session.dificuldade] ?? 'text-[#9d8ec8]'}`}>
                {session.dificuldade}
              </span>
            </p>
          )}
        </div>
        <span className="shrink-0 text-sm text-[#9d8ec8] bg-[#241c45] border border-[#352a60] px-2.5 py-1 rounded-full">
          {qas.length} {qas.length !== 1 ? 'perguntas' : 'pergunta'}
        </span>
      </header>

      {/* Hint */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#1a1433]/50 text-sm text-[#9d8ec8] text-center border-b border-[#352a60]/50">
        Estou pensando em {session ? `um(a) ${session.categoria}` : 'uma entidade famosa'}. Faça perguntas de sim/não para descobrir quem é!
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {qas.length === 0 && (
          <p className="text-center text-[#352a60] mt-12">Nenhuma pergunta ainda. Comece perguntando!</p>
        )}
        {qas.map((qa, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="self-end bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] sm:max-w-xs text-sm animate-slide-in-right">
              {qa.question}
            </div>
            <div className={`self-start rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%] sm:max-w-xs text-sm font-semibold animate-slide-in-left ${answerBubbleClass(qa.answer)}`}>
              {qa.answer}
            </div>
          </div>
        ))}
        {warning && !isLoading && (
          <div className="bg-orange-900/40 border border-orange-700/60 rounded-2xl rounded-tl-sm px-4 py-2 max-w-sm text-sm text-orange-300">
            ⚠️ {warning.message}
          </div>
        )}
        {isLoading && (
          <div className="self-start bg-[#1a1433] border border-[#352a60] rounded-2xl rounded-tl-sm px-4 py-3 animate-slide-in-left">
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-[#9d8ec8] thinking-dot" />
              <span className="w-2 h-2 rounded-full bg-[#9d8ec8] thinking-dot" />
              <span className="w-2 h-2 rounded-full bg-[#9d8ec8] thinking-dot" />
            </div>
          </div>
        )}
        <div ref={historyEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-[#1a1433] border-t border-[#352a60] p-4 space-y-3">
        {!guessMode ? (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: É uma pessoa real?"
                disabled={isLoading}
                className="flex-1 bg-[#241c45] border border-[#352a60] rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50 text-[#f0eeff] placeholder:text-[#9d8ec8] min-h-[44px]"
              />
              <button
                onClick={handleAsk}
                disabled={!input.trim() || isLoading}
                className="px-4 py-3 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition-all min-h-[44px] text-white"
              >
                {isLoading ? '…' : 'Perguntar'}
              </button>
            </div>
            <button
              onClick={() => { setGuessMode(true); setInput('') }}
              disabled={isLoading}
              className="w-full py-3 border border-amber-600/60 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 rounded-xl text-sm font-semibold transition-all min-h-[44px]"
            >
              🎯 Fazer chute final
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Quem é? Digite o nome..."
                disabled={isLoading}
                className="flex-1 bg-[#241c45] border border-amber-600/40 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 text-[#f0eeff] placeholder:text-[#9d8ec8] min-h-[44px]"
                autoFocus
              />
              <button
                onClick={handleGuess}
                disabled={!input.trim() || isLoading}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40 rounded-xl text-sm font-semibold transition-all min-h-[44px]"
              >
                {isLoading ? '…' : 'Adivinhar!'}
              </button>
            </div>
            <button
              onClick={() => { setGuessMode(false); setInput('') }}
              disabled={isLoading}
              className="w-full py-3 text-[#9d8ec8] hover:text-[#f0eeff] disabled:opacity-40 text-sm transition-colors min-h-[44px]"
            >
              ← Voltar a perguntar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
