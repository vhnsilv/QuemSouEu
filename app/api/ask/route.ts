import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getDailyEntity, getEntityByIndex } from '../../../lib/entities'
import { parseFreeToken } from '../../../lib/token'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { question, mode, token } = await req.json()

  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Pergunta inválida' }, { status: 400 })
  }

  let secret: string
  if (mode === 'daily') {
    secret = getDailyEntity().nome
  } else if (mode === 'free' && token) {
    const index = parseFreeToken(token)
    if (index === null) return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    secret = getEntityByIndex(index).nome
  } else {
    return NextResponse.json({ error: 'Modo inválido' }, { status: 400 })
  }

  const systemPrompt = `Você está participando de um jogo de adivinhação chamado "Quem Sou Eu?". A entidade secreta é: "${secret}".

O jogador vai fazer perguntas de sim/não. Você deve responder APENAS com uma dessas quatro opções em português:
- "Sim"
- "Não"
- "Mais ou menos"
- "Não sei"

Regras absolutas:
1. Nunca revele o nome da entidade, mesmo que o jogador pergunte diretamente.
2. Responda somente com uma das quatro opções acima — sem explicações, sem pontuação extra.
3. Se a pergunta não se aplicar à entidade, responda "Não sei".
4. Se a pergunta for ambígua mas tiver uma resposta razoável, responda com "Mais ou menos".`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 20,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: question }],
  })

  const answer = (message.content[0] as { text: string }).text.trim()
  return NextResponse.json({ answer })
}
