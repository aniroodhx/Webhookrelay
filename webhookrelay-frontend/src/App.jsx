import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { DashboardPage } from './pages/DashboardPage';
import { PublishEventPage } from './pages/PublishEventPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />

        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="publish" element={<PublishEventPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
