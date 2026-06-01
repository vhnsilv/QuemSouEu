import entitiesData from '../data/entities.json'

export type Entity = { nome: string; categoria: string; dificuldade: string }

const entities = entitiesData as Entity[]

export function getDailyEntity(): Entity {
  const today = new Date().toISOString().slice(0, 10) // UTC YYYY-MM-DD
  const [year, month, day] = today.split('-').map(Number)
  const seed = year * 366 + month * 31 + day
  return entities[seed % entities.length]
}

export function getEntityByIndex(index: number): Entity {
  return entities[((index % entities.length) + entities.length) % entities.length]
}

export function randomEntityIndex(): number {
  return Math.floor(Math.random() * entities.length)
}
