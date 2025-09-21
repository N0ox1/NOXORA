type Key = string
type Bucket = { tokens: number; reset: number }
const map = new Map<Key, Bucket>()
const WINDOW_MS = 60_000
const LIMIT = 60

export function rlConsume(ip: string, tenant: string) {
  const now = Date.now()
  const k = `${tenant}:${ip}`
  let b = map.get(k)
  
  if (!b || now > b.reset) {
    b = { tokens: LIMIT, reset: now + WINDOW_MS }
    map.set(k, b)
  }
  
  if (b.tokens <= 0) return { ok: false, resetIn: Math.max(0, b.reset - now) }
  
  b.tokens--
  return { ok: true, resetIn: b.reset - now }
}




















