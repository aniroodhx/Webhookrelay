import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RelayDataProvider, useRelayData } from '../RelayDataContext';
import { api } from '../api';

function BackendStatusBanner() {
  const { subscriptionsError } = useRelayData();
  if (!subscriptionsError) return null;
  return (
    <div className="backend-banner">
      Backend unreachable: {subscriptionsError.message}. Is it running on{' '}
      <code>{api.baseUrl}</code>?
    </div>
  );
}

export function AppLayout() {
  return (
    <RelayDataProvider>
      <div className="app-shell-with-nav">
        <Sidebar />
        <div className="app-main">
          <BackendStatusBanner />
          <div className="app-main-content">
            <Outlet />
          </div>
        </div>
      </div>
    </RelayDataProvider>
  );
}
