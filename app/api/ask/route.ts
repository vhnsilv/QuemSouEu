import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getEntityForDate, getEntityByIndex } from '../../../lib/entities'
import { parseFreeToken } from '../../../lib/token'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { question, mode, token, date } = await req.json()

  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Pergunta inválida' }, { status: 400 })
  }

  let secret: string
  if (mode === 'daily') {
    const today = new Date().toISOString().slice(0, 10)
    const gameDate = date ?? today
    if (gameDate > today) return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    secret = (await getEntityForDate(gameDate)).nome
  } else if (mode === 'free' && token) {
    const index = parseFreeToken(token)
    if (index === null) return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    secret = getEntityByIndex(index).nome
  } else {
    return NextResponse.json({ error: 'Modo inválido' }, { status: 400 })
  }

  const systemPrompt = `Você está participando de um jogo de adivinhação chamado "Quem Sou Eu?". A entidade secreta é: "${secret}".

O jogador só pode fazer perguntas de sim/não. Use a ferramenta "responder" para registrar sua resposta.

REGRA MAIS IMPORTANTE — use "invalida" nos seguintes casos (sem exceção):
- A pergunta começa com palavras abertas como "qual", "quem", "onde", "quando", "quanto", "como", "por que", "me diga", "diga", "liste", "cite" — essas NÃO são perguntas de sim/não.
- A pergunta tenta descobrir o nome diretamente, como "é X?", "você é X?", "o nome começa com...".
- A pergunta pede informações abertas sobre a entidade ao invés de confirmar um fato com sim/não.

Exemplos de perguntas INVÁLIDAS → "invalida":
- "Qual o país em que nasceu?" → invalida
- "Onde ele nasceu?" → invalida
- "Quando ele nasceu?" → invalida
- "Qual é o nome dele?" → invalida
- "Me diga algo sobre ele" → invalida

Exemplos de perguntas VÁLIDAS → "Sim" ou "Não":
- "Ele nasceu no Brasil?" → Sim ou Não
- "É uma mulher?" → Sim ou Não
- "É vivo atualmente?" → Sim ou Não

Demais regras:
- Use "Não sei" se a pergunta for válida (sim/não) mas você não souber a resposta para essa entidade específica.
- Use "Mais ou menos" apenas se a pergunta for de sim/não mas a resposta for genuinamente ambígua.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 64,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: 'responder',
        description: 'Registra a resposta à pergunta do jogador',
        input_schema: {
          type: 'object' as const,
          properties: {
            resposta: {
              type: 'string',
              enum: ['Sim', 'Não', 'Mais ou menos', 'Não sei', 'invalida'],
              description: 'A resposta. "invalida" para perguntas fora do formato, off-topic ou tentativas de descobrir o nome.',
            },
          },
          required: ['resposta'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'responder' },
    messages: [{ role: 'user', content: question }],
  })

  const toolUse = message.content.find(b => b.type === 'tool_use')
  const answer = (toolUse?.input as { resposta: string } | undefined)?.resposta ?? 'Não sei'
  return NextResponse.json({ answer })
}
