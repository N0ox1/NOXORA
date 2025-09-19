import { useState, useEffect } from 'react';

export function useTenant(defaultTenantId: string) {
  const [tenantId, setTenantId] = useState(defaultTenantId);

  useEffect(() => {
    // Pode ser expandido para buscar de localStorage ou context
    setTenantId(defaultTenantId);
  }, [defaultTenantId]);

  return { tenantId, setTenantId };
}

















