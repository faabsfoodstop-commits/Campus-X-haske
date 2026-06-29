import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconHome,
  IconCoin,
  IconTrendingUp,
  IconProfile,
  IconMenu,
} from './Icons';
import './BottomNavigation.css';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/dashboard', icon: IconHome, label: 'Home', id: 'home' },
    { path: '/marketplace', icon: IconCoin, label: 'Earn', id: 'earn' },
    { path: '/point-market', icon: IconTrendingUp, label: 'Trade', id: 'trade' },
    { path: '/profile', icon: IconProfile, label: 'Me', id: 'me' },
    { path: '/menu', icon: IconMenu, label: 'More', id: 'more' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-navigation">
      {tabs.map(tab => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`nav-tab ${isActive(tab.path) ? 'active' : ''}`}
            title={tab.label}
            aria-current={isActive(tab.path) ? 'page' : undefined}
          >
            <span className="nav-icon">
              <IconComponent />
            </span>
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
