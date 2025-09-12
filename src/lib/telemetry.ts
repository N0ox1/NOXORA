export type Span = { setAttributes?: (a: Record<string, any>) => void; setStatus?: (s: { code: number }) => void; end?: () => void };
export function createSpan<T = any>(name: string, fn?: (span: Span) => T): T | Span {
  const span: Span = { setAttributes: () => {}, setStatus: () => {}, end: () => {} };
  return fn ? fn(span) : span;
}
export function addSpanAttributes(span: Span, attrs: Record<string, any>) { span?.setAttributes?.(attrs); }
export function markSpanAsError(_span: Span, _err?: unknown) { /* optional no-op, keep for compatibility */ }
export function endSpan(span?: Span) { span?.end?.(); }