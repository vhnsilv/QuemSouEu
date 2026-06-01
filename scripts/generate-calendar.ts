import entitiesData from '../data/entities.json'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

type Entity = { nome: string; categoria: string; dificuldade: string }

const entities = entitiesData as Entity[]

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (((s * 1664525) + 1013904223) | 0) >>> 0
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Monta pool base de 50 entidades com dificuldades intercaladas: E,M,E,M,H × 10
// Ciclo linear garante gap mínimo de 50 dias entre repetições da mesma entidade
function buildPool(count: number): Entity[] {
  const easy   = seededShuffle(entities.filter(e => e.dificuldade === 'fácil'),  42)
  const medium = seededShuffle(entities.filter(e => e.dificuldade === 'médio'),  99)
  const hard   = seededShuffle(entities.filter(e => e.dificuldade === 'difícil'), 7)

  const base: Entity[] = []
  for (let block = 0; block < 10; block++) {
    base.push(easy[block * 2])
    base.push(medium[block * 2])
    base.push(easy[block * 2 + 1])
    base.push(medium[block * 2 + 1])
    base.push(hard[block])
  }

  // Ciclo linear puro — sem shuffle entre ciclos
  return Array.from({ length: count }, (_, i) => base[i % base.length])
}

function generateCalendar(): Record<string, string> {
  const DAYS = 730 // 2026 + 2027
  const pool = buildPool(DAYS)
  const calendar: Record<string, string> = {}

  for (let i = 0; i < DAYS; i++) {
    const d = new Date(Date.UTC(2026, 0, 1 + i))
    const dateStr = d.toISOString().slice(0, 10)
    calendar[dateStr] = pool[i].nome
  }
  return calendar
}

const calendar = generateCalendar()

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '../data/calendar-2026.json')
writeFileSync(outPath, JSON.stringify(calendar, null, 2), 'utf-8')

const days = Object.keys(calendar).length
console.log(`✓ Gerado calendário com ${days} dias (${Object.values(calendar)[0]} → ${Object.values(calendar)[days - 1]})`)

// Verifica janela mínima entre repetições
const entries = Object.entries(calendar)
const lastSeen: Record<string, number> = {}
let minGap = Infinity
for (let i = 0; i < entries.length; i++) {
  const name = entries[i][1]
  if (lastSeen[name] !== undefined) {
    minGap = Math.min(minGap, i - lastSeen[name])
  }
  lastSeen[name] = i
}
console.log(`✓ Menor intervalo entre repetições: ${minGap} dias`)
