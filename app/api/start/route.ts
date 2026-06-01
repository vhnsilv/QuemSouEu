import { NextRequest, NextResponse } from 'next/server'
import { getDailyEntity, getEntityByIndex, randomEntityIndex } from '../../../lib/entities'
import { createFreeToken } from '../../../lib/token'

export async function POST(req: NextRequest) {
  const { mode } = await req.json()

  if (mode === 'daily') {
    const entity = getDailyEntity()
    return NextResponse.json({
      mode: 'daily',
      categoria: entity.categoria,
      dificuldade: entity.dificuldade,
    })
  }

  if (mode === 'free') {
    const index = randomEntityIndex()
    const token = createFreeToken(index)
    const entity = getEntityByIndex(index)
    return NextResponse.json({
      mode: 'free',
      token,
      categoria: entity.categoria,
      dificuldade: entity.dificuldade,
    })
  }

  return NextResponse.json({ error: 'Modo inválido' }, { status: 400 })
}
