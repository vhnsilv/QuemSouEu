import { NextRequest, NextResponse } from 'next/server'
import { getDailyEntity, getEntityByIndex } from '../../../lib/entities'
import { parseFreeToken } from '../../../lib/token'

export async function POST(req: NextRequest) {
  const { guess, mode, token } = await req.json()

  if (!guess || typeof guess !== 'string') {
    return NextResponse.json({ error: 'Chute inválido' }, { status: 400 })
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

  const correct = guess.trim().toLowerCase() === secret.toLowerCase()
  return NextResponse.json({ correct, secret })
}
