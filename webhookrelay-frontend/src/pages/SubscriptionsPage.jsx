import { Link } from 'react-router-dom';
import { useRelayData } from '../RelayDataContext';
import { SubscriptionsPanel } from '../components/SubscriptionsPanel';

export function SubscriptionsPage() {
  const { subscriptions, refreshSubscriptions } = useRelayData();

  return (
    <div>
      <h1>Subscriptions</h1>
      <p className="page-subtitle">
        Step 1 of the story: pick a scenario, then head to{' '}
        <Link to="/app/publish">Publish Event</Link> and watch it play out on{' '}
        <Link to="/app/deliveries">Deliveries</Link>.
      </p>

      <SubscriptionsPanel
        subscriptions={subscriptions}
        onChanged={refreshSubscriptions}
      />
    </div>
  );
}
