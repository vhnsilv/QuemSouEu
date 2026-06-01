'use client'

import { useState, useRef, useEffect } from 'react'

type QA = { question: string; answer: string }
type GameStatus = 'selecting' | 'playing' | 'won' | 'lost'
type GameMode = 'daily' | 'free'

type GameSession = {
  mode: GameMode
  token: string | null
  categoria: string
  dificuldade: string
}

export default function Game() {
  const [status, setStatus] = useState<GameStatus>('selecting')
  const [session, setSession] = useState<GameSession | null>(null)
  const [qas, setQas] = useState<QA[]>([])
  const [input, setInput] = useState('')
  const [guessMode, setGuessMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [secret, setSecret] = useState('')
  const historyEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qas])

  async function startGame(mode: GameMode) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const data = await res.json()
      setSession({
        mode,
        token: data.token ?? null,
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
    setIsLoading(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, mode: session.mode, token: session.token }),
      })
      const data = await res.json()
      const answer = data.answer ?? 'Não sei'
      setQas(prev => [...prev, { question: q, answer }])
    } catch {
      setQas(prev => [...prev, { question: q, answer: 'Erro ao obter resposta. Tente novamente.' }])
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
        body: JSON.stringify({ guess, mode: session.mode, token: session.token }),
      })
      const data = await res.json()
      setSecret(data.secret ?? '')
      if (data.correct) {
        setStatus('won')
      } else {
        setQas(prev => [...prev, { question: `Chute: "${guess}"`, answer: 'Errado!' }])
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
  }

  const dificuldadeCor: Record<string, string> = {
    'fácil': 'text-green-400',
    'médio': 'text-yellow-400',
    'difícil': 'text-red-400',
  }

  if (status === 'selecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6 bg-gray-950 text-white">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Quem Sou Eu?</h1>
          <p className="text-gray-400 text-sm">
            Descubra a entidade secreta fazendo perguntas de sim/não.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => startGame('daily')}
            disabled={isLoading}
            className="flex flex-col items-center gap-1 px-6 py-5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 rounded-2xl font-semibold transition-colors"
          >
            <span className="text-2xl">📅</span>
            <span className="text-lg">Desafio do Dia</span>
            <span className="text-xs text-blue-200 font-normal">A mesma entidade para todo mundo</span>
          </button>

          <button
            onClick={() => startGame('free')}
            disabled={isLoading}
            className="flex flex-col items-center gap-1 px-6 py-5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-2xl font-semibold transition-colors"
          >
            <span className="text-2xl">🎲</span>
            <span className="text-lg">Modo Livre</span>
            <span className="text-xs text-gray-400 font-normal">Entidade aleatória para treinar</span>
          </button>
        </div>

        {isLoading && <p className="text-gray-500 text-sm">Carregando...</p>}
      </div>
    )
  }

  if (status === 'won') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-gray-950 text-white">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-green-400">Parabéns!</h1>
        <p className="text-lg text-gray-300">
          Você descobriu que sou <span className="font-bold text-white">{secret}</span>!
        </p>
        <p className="text-gray-400">
          Você usou <span className="font-bold text-yellow-400">{qas.length}</span> pergunta{qas.length !== 1 ? 's' : ''}.
        </p>
        <button
          onClick={handleRestart}
          className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors"
        >
          Jogar novamente
        </button>
      </div>
    )
  }

  if (status === 'lost') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-gray-950 text-white">
        <div className="text-6xl">😔</div>
        <h1 className="text-3xl font-bold text-red-400">Quase lá...</h1>
        <p className="text-lg text-gray-300">
          A resposta era <span className="font-bold text-white">{secret}</span>.
        </p>
        <p className="text-gray-400">
          Você usou <span className="font-bold text-yellow-400">{qas.length}</span> pergunta{qas.length !== 1 ? 's' : ''}.
        </p>
        <button
          onClick={handleRestart}
          className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quem Sou Eu?</h1>
          {session && (
            <p className="text-xs text-gray-500 mt-0.5">
              {session.mode === 'daily' ? '📅 Desafio do Dia' : '🎲 Modo Livre'}
              {' · '}
              <span className="capitalize">{session.categoria}</span>
              {' · '}
              <span className={dificuldadeCor[session.dificuldade] ?? 'text-gray-400'}>
                {session.dificuldade}
              </span>
            </p>
          )}
        </div>
        <span className="text-sm text-gray-400">
          {qas.length} pergunta{qas.length !== 1 ? 's' : ''}
        </span>
      </header>

      {/* Hint */}
      <div className="px-6 py-3 bg-gray-900 text-sm text-gray-400 text-center">
        Estou pensando em {session ? `um(a) ${session.categoria}` : 'uma entidade famosa'}. Faça perguntas de sim/não para descobrir quem é!
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {qas.length === 0 && (
          <p className="text-center text-gray-600 mt-12">Nenhuma pergunta ainda. Comece perguntando!</p>
        )}
        {qas.map((qa, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="self-end bg-blue-700 rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs text-sm">
              {qa.question}
            </div>
            <div className="self-start bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-2 max-w-xs text-sm font-semibold">
              {qa.answer}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col gap-1">
            <div className="self-start bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-2 max-w-xs text-sm text-gray-400 italic">
              Pensando...
            </div>
          </div>
        )}
        <div ref={historyEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 p-4 space-y-3">
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
                className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                onClick={handleAsk}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-semibold transition-colors"
              >
                {isLoading ? 'Aguardando...' : 'Perguntar'}
              </button>
            </div>
            <button
              onClick={() => { setGuessMode(true); setInput('') }}
              disabled={isLoading}
              className="w-full py-2 border border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-40 rounded-lg text-sm font-semibold transition-colors"
            >
              Fazer chute final
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
                className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                autoFocus
              />
              <button
                onClick={handleGuess}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-40 rounded-lg text-sm font-semibold transition-colors"
              >
                {isLoading ? 'Verificando...' : 'Adivinhar!'}
              </button>
            </div>
            <button
              onClick={() => { setGuessMode(false); setInput('') }}
              disabled={isLoading}
              className="w-full py-2 text-gray-500 hover:text-gray-300 disabled:opacity-40 text-sm transition-colors"
            >
              ← Voltar a perguntar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
