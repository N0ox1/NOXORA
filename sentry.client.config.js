// NOXORA: noop Sentry client config para dev
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

export function capturePerformanceMetric(name, value, unit = 'millisecond') {
  // noop
}

export function captureApiError(error, endpoint, method, statusCode) {
  // noop
}

export function captureValidationError(error, field, value) {
  // noop
}

export function captureAuthError(error, action) {
  // noop
}

export function withErrorBoundary(Component, fallback = null) {
  return Component;
}

export function withPerformanceTracking(Component, componentName) {
  return Component;
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
  capturePerformanceMetric,
  captureApiError,
  captureValidationError,
  captureAuthError,
  withErrorBoundary,
  withPerformanceTracking,
};
