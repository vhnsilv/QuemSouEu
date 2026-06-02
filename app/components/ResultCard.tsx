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
  const { won, questions, answers, mode, date, streak, secret, onRestart } = props
  const [copied, setCopied] = useState(false)

  const emojiGrid = answers.map(a => ANSWER_EMOJI[a]).filter(Boolean).join('')

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
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-[#0d0a1e] text-[#f0eeff] animate-fade-up">
      <div className="text-6xl animate-bounce-in">{won ? '🎉' : '😔'}</div>

      <div className="text-center space-y-2">
        <h1 className={`text-3xl font-bold ${
          won
            ? 'bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent'
            : 'text-rose-400'
        }`}>
          {won ? 'Parabéns!' : 'Quase lá...'}
        </h1>
        {won ? (
          <p className="text-lg text-[#9d8ec8]">
            Você descobriu que sou <span className="font-bold text-[#f0eeff]">{secret}</span>!
          </p>
        ) : (
          <p className="text-lg text-[#9d8ec8]">
            Era <span className="font-bold text-[#f0eeff]">{secret}</span>. Tente amanhã!
          </p>
        )}
      </div>

      <div className={`flex gap-6 text-center bg-[#1a1433] border rounded-2xl px-8 py-4 ${
        won ? 'border-emerald-800/50' : 'border-[#352a60]'
      }`}>
        <div>
          <p className="text-2xl font-bold text-amber-400">{questions}</p>
          <p className="text-xs text-[#9d8ec8]">pergunta{questions !== 1 ? 's' : ''}</p>
        </div>
        {mode === 'daily' && streak > 0 && (
          <>
            <div className="w-px bg-[#352a60]" />
            <div>
              <p className="text-2xl font-bold text-orange-400">🔥 {streak}</p>
              <p className="text-xs text-[#9d8ec8]">dia{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}</p>
            </div>
          </>
        )}
      </div>

      {emojiGrid && (
        <div className="text-2xl tracking-wider">{emojiGrid}</div>
      )}

      {mode === 'daily' && date && (
        <p className="text-xs text-[#9d8ec8]">📅 {formatDate(date)}</p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-[#241c45] border border-[#352a60] hover:bg-[#2d2255] rounded-xl font-semibold text-sm transition-all min-h-[44px]"
        >
          {copied ? '✓ Copiado!' : '📋 Copiar resultado'}
        </button>
        <button
          onClick={onRestart}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all min-h-[44px] ${
            won
              ? 'bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
              : 'bg-[#241c45] border border-[#352a60] hover:bg-[#2d2255]'
          }`}
        >
          {won ? '🎮 Jogar novamente' : '🔄 Tentar novamente'}
        </button>
      </div>
    </div>
  )
}
