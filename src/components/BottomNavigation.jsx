import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNavigation.css';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/dashboard', icon: '🏠', label: 'Home', id: 'home' },
    { path: '/marketplace', icon: '💰', label: 'Earn', id: 'earn' },
    { path: '/point-market', icon: '📊', label: 'Trade', id: 'trade' },
    { path: '/profile', icon: '👤', label: 'Me', id: 'me' },
    { path: '/menu', icon: '📋', label: 'More', id: 'more' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          className={`nav-tab ${isActive(tab.path) ? 'active' : ''}`}
          title={tab.label}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
