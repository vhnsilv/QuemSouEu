import { NextRequest, NextResponse } from 'next/server'
import { getEntityForDate, getEntityByIndex, randomEntityIndex } from '../../../lib/entities'
import { createFreeToken } from '../../../lib/token'

export async function POST(req: NextRequest) {
  const { mode, date } = await req.json()

  if (mode === 'daily') {
    const today = new Date().toISOString().slice(0, 10)
    const requestedDate = date ?? today

    // Rejeita datas futuras
    if (requestedDate > today) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    }

    const entity = await getEntityForDate(requestedDate)
    return NextResponse.json({
      mode: 'daily',
      date: requestedDate,
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
