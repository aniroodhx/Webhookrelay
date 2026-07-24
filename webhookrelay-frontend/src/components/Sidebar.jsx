import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/publish', label: 'Publish Event' },
  { to: '/app/subscriptions', label: 'Subscriptions' },
  { to: '/app/deliveries', label: 'Deliveries' },
];

export function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink to="/" className="sidebar-brand">
        <span className="dot" />
        WebhookRelay
      </NavLink>
      <ul className="sidebar-links">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
