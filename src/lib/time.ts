export function rangeSlots(dateISO: string, startHour = 9, endHour = 18, stepMin = 30) {
  const day = new Date(dateISO + 'T00:00:00.000Z');
  const slots: { startAt: string; endAt: string }[] = [];
  
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m));
      const end = new Date(start.getTime() + stepMin * 60000);
      slots.push({ startAt: start.toISOString(), endAt: end.toISOString() });
    }
  }
  
  return slots;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function dayBoundsUTC(dateISO: string) {
  const start = new Date(dateISO + 'T00:00:00.000Z');
  const end = new Date(dateISO + 'T23:59:59.999Z');
  return { start, end };
}






