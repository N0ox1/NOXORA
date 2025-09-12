// NOXORA: noop Sentry server config para dev
// Quando for ativar observabilidade real, reverter para integração oficial

// Funções no-op que mantêm a mesma interface
export function setUserContext(userId, email, tenantId) {
  // noop
}

export function setTenantContext(tenantId, tenantName) {
  // noop
}

export function captureError(error, context = {}) {
  // noop
}

export function captureMessage(message, level = 'info', context = {}) {
  // noop
}

export function addBreadcrumb(message, category = 'manual', data = {}) {
  // noop
}

export function startTransaction(name, operation) {
  return { finish: () => {} };
}

export function finishTransaction(transaction) {
  // noop
}

export function captureMetric(name, value, unit = 'none', tags = {}) {
  // noop
}

export function captureHistogram(name, value, unit = 'none', tags = {}) {
  // noop
}

export function captureGauge(name, value, unit = 'none', tags = {}) {
  // noop
}

// Middleware para capturar erros de API
export function withSentryErrorHandling(handler) {
  return handler;
}

// Exportar objeto padrão
export default {
  setUserContext,
  setTenantContext,
  captureError,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  finishTransaction,
  captureMetric,
  captureHistogram,
  captureGauge,
  withSentryErrorHandling,
};
