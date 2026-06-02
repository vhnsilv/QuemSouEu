'use client'

import { useState } from 'react'

type Props = {
  won: boolean
  questions: number
  answers: string[]
  mode: 'daily' | 'free'
  date: string | null
  streak: number
  secret: string
  onRestart: () => void
}

const ANSWER_EMOJI: Record<string, string> = {
  'Sim': '🟢',
  'Não': '🔴',
  'Mais ou menos': '🟡',
  'Não sei': '⚫',
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function buildShareText(props: Props): string {
  const { won, questions, answers, mode, date, streak, secret } = props
  const emojiGrid = answers
    .map(a => ANSWER_EMOJI[a])
    .filter(Boolean)
    .join('')

  const lines: string[] = ['Quem Sou Eu? 🕵️']

  if (mode === 'daily' && date) {
    lines.push(`📅 ${formatDate(date)} • ${questions} pergunta${questions !== 1 ? 's' : ''}`)
    if (won && streak > 1) lines.push(`🔥 Sequência: ${streak} dias`)
    if (!won) lines.push(`❌ Não descobri... era ${secret}`)
  } else {
    lines.push(`🎲 Modo Livre • ${questions} pergunta${questions !== 1 ? 's' : ''}`)
    if (won) lines.push('✅ Acertei!')
    else lines.push(`❌ Não descobri... era ${secret}`)
  }

  if (emojiGrid) lines.push('', emojiGrid)
  lines.push('', 'Jogue: quem-sou-eu.vercel.app')

  return lines.join('\n')
}

export default function ResultCard(props: Props) {
  const { won, questions, mode, date, streak, secret, onRestart } = props
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = buildShareText(props)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-gray-950 text-white">
      <div className="text-6xl">{won ? '🎉' : '😔'}</div>

      <div className="text-center space-y-1">
        <h1 className={`text-3xl font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
          {won ? 'Parabéns!' : 'Quase lá...'}
        </h1>
        {won ? (
          <p className="text-lg text-gray-300">
            Você descobriu que sou <span className="font-bold text-white">{secret}</span>!
          </p>
        ) : (
          <p className="text-lg text-gray-300">
            Era <span className="font-bold text-white">{secret}</span>. Tente amanhã!
          </p>
        )}
      </div>

      <div className="flex gap-6 text-center">
        <div>
          <p className="text-2xl font-bold text-yellow-400">{questions}</p>
          <p className="text-xs text-gray-400">pergunta{questions !== 1 ? 's' : ''}</p>
        </div>
        {mode === 'daily' && streak > 0 && (
          <div>
            <p className="text-2xl font-bold text-orange-400">🔥 {streak}</p>
            <p className="text-xs text-gray-400">dia{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {mode === 'daily' && date && (
        <p className="text-xs text-gray-500">📅 {formatDate(date)}</p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-sm transition-colors"
        >
          {copied ? 'Copiado! ✓' : '📋 Copiar resultado'}
        </button>
        <button
          onClick={onRestart}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
            won
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          {won ? 'Jogar novamente' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  )
}
