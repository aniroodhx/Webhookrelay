import { createContext, useCallback, useContext, useState } from 'react';
import { api } from './api';
import { usePolling } from './hooks/usePolling';

const RelayDataContext = createContext(null);

export function RelayDataProvider({ children }) {
  const [subsVersion, setSubsVersion] = useState(0);
  const refreshSubscriptions = useCallback(() => setSubsVersion((v) => v + 1), []);

  const { data: subscriptions, error: subscriptionsError } = usePolling(
    useCallback(() => api.listSubscriptions(), []),
    4000,
    subsVersion
  );

  const { data: deliveries, error: deliveriesError } = usePolling(
    useCallback(() => api.listDeliveries(), []),
    1500
  );

  const value = {
    subscriptions: subscriptions || [],
    subscriptionsError,
    deliveries: deliveries || [],
    deliveriesError,
    refreshSubscriptions,
  };

  return (
    <RelayDataContext.Provider value={value}>
      {children}
    </RelayDataContext.Provider>
  );
}

export function useRelayData() {
  const ctx = useContext(RelayDataContext);
  if (!ctx) {
    throw new Error('useRelayData must be used within a RelayDataProvider');
  }
  return ctx;
}
