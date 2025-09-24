export function startOfDay(d: Date){ const x=new Date(d); x.setUTCHours(0,0,0,0); return x; }
export function addDays(d: Date, n: number){ const x=new Date(d); x.setUTCDate(x.getUTCDate()+n); return x; }
export function toISO(d: Date){ return d.toISOString(); }
export function fmtHM(d: Date){ return d.toISOString().substring(11,16); }

























