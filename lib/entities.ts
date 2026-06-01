import entitiesData from '../data/entities.json'
import { Redis } from '@upstash/redis'

export type Entity = { nome: string; categoria: string; dificuldade: string }

const entities = entitiesData as Entity[]

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null

function seedFallback(date: string): Entity {
  const [year, month, day] = date.split('-').map(Number)
  const seed = year * 366 + month * 31 + day
  return entities[seed % entities.length]
}

export async function getEntityForDate(date: string): Promise<Entity> {
  if (redis) {
    const name = await redis.get<string>(`calendar:${date}`)
    if (name) {
      const found = entities.find(e => e.nome === name)
      if (found) return found
    }
  }
  return seedFallback(date)
}

export function getEntityByIndex(index: number): Entity {
  return entities[((index % entities.length) + entities.length) % entities.length]
}

export function randomEntityIndex(): number {
  return Math.floor(Math.random() * entities.length)
}
