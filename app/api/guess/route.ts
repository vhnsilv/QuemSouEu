import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { getEntityForDate, getEntityByIndex } from '../../../lib/entities'
import { parseFreeToken } from '../../../lib/token'

const MAX_GUESSES_PER_DAY = 30

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
    : null

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

async function checkRateLimit(ip: string): Promise<boolean> {
  if (!redis) return true
  const today = new Date().toISOString().slice(0, 10)
  const key = `rl:guess:${ip}:${today}`
  const count = await redis.incr(key)
  if (count === 1) {
    // Expira à meia-noite UTC do dia seguinte
    const now = new Date()
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    await redis.expireat(key, Math.floor(midnight.getTime() / 1000))
  }
  return count <= MAX_GUESSES_PER_DAY
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente amanhã.' },
      { status: 429 }
    )
  }

  const { guess, mode, token, date } = await req.json()

  if (!guess || typeof guess !== 'string') {
    return NextResponse.json({ error: 'Chute inválido' }, { status: 400 })
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

  const correct = guess.trim().toLowerCase() === secret.toLowerCase()
  return NextResponse.json({ correct, secret: correct ? undefined : secret })
}
