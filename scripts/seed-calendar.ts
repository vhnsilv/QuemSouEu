/**
 * Popula o Vercel KV / Upstash Redis com o calendário gerado.
 *
 * Requer no .env.local:
 *   KV_REST_API_URL=...
 *   KV_REST_API_TOKEN=...
 *
 * Uso:
 *   npx tsx scripts/seed-calendar.ts
 *   npx tsx scripts/seed-calendar.ts --dry-run   (apenas lista as chaves, não escreve)
 */

import calendarData from '../data/calendar-2026.json'
import { Redis } from '@upstash/redis'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const dryRun = process.argv.includes('--dry-run')

const calendar = calendarData as Record<string, string>
const entries = Object.entries(calendar)

if (dryRun) {
  console.log(`Dry-run: ${entries.length} chaves a serem escritas`)
  entries.slice(0, 5).forEach(([date, name]) => console.log(`  calendar:${date} → ${name}`))
  console.log('  ...')
  process.exit(0)
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

async function seed() {
  console.log(`Enviando ${entries.length} entradas para o Redis...`)

  // Pipeline em lotes de 100
  const BATCH = 100
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH)
    const pipeline = redis.pipeline()
    for (const [date, name] of batch) {
      pipeline.set(`calendar:${date}`, name)
    }
    await pipeline.exec()
    process.stdout.write(`\r${Math.min(i + BATCH, entries.length)}/${entries.length}`)
  }

  console.log('\n✓ Seed concluído')

  // Verifica um exemplo
  const today = new Date().toISOString().slice(0, 10)
  const val = await redis.get<string>(`calendar:${today}`)
  console.log(`✓ Verificação: calendar:${today} → ${val ?? '(não encontrado — verifique se a data está no intervalo 2026-2027)'}`)
}

seed().catch(err => {
  console.error('Erro:', err.message)
  process.exit(1)
})
