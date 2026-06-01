import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.GAME_SECRET ?? 'dev-secret-troque-em-producao'

export function createFreeToken(index: number): string {
  const payload = String(index)
  const mac = createHmac('sha256', SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}:${mac}`).toString('base64url')
}

export function parseFreeToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const colon = decoded.indexOf(':')
    if (colon === -1) return null
    const payload = decoded.slice(0, colon)
    const mac = decoded.slice(colon + 1)
    const expected = createHmac('sha256', SECRET).update(payload).digest('hex')
    const macBuf = Buffer.from(mac, 'hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    if (macBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(macBuf, expectedBuf)) return null
    const index = parseInt(payload, 10)
    return isNaN(index) ? null : index
  } catch {
    return null
  }
}
