export function parseAllowedOrigins(): string[] { 
  const raw = (process.env.ALLOWED_ORIGINS || '').trim(); 
  const DEFAULT = ['http://localhost:3000']; 
  if (!raw) return DEFAULT; 
  return raw.split(',').map(s => s.trim()).filter(Boolean); 
}

export function isAllowed(url: string | null): boolean { 
  if (!url) return false; 
  const allowed = parseAllowedOrigins(); 
  return allowed.some(a => url === a || url.startsWith(a + '/')); 
}

export function isWriteMethod(method: string) { 
  return ['POST','PUT','PATCH','DELETE'].includes(method.toUpperCase()); 
}

export function csrfAllowedForRequest(req: Request): boolean { 
  const h = req.headers; 
  const origin = h.get('origin'); 
  const referer = h.get('referer'); 
  return isAllowed(origin) || isAllowed(referer); 
}
