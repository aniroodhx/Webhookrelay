import { Link } from 'react-router-dom';
import { useRelayData } from '../RelayDataContext';
import { PublishEventPanel } from '../components/PublishEventPanel';

export function PublishEventPage() {
  const { subscriptions } = useRelayData();
  const eventTypes = [...new Set(subscriptions.map((s) => s.eventType))];

  return (
    <div>
      <h1>Publish Event</h1>
      <p className="page-subtitle">
        Step 2: publish an event matching a subscription's event type, then
        watch it on <Link to="/app/deliveries">Deliveries</Link>.
      </p>

      <PublishEventPanel eventTypes={eventTypes} onPublished={() => {}} />
    </div>
  );
}
