import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/menu', icon: '🍽️', label: 'Menu' },
    { path: '/dine-in', icon: '🍽️', label: 'Dine-in' },
    { path: '/takeaway', icon: '📦', label: 'Takeaway' },
    { path: '/create-order', icon: '➕', label: 'New Order' },
    { path: '/kitchen', icon: '👨‍🍳', label: 'Kitchen' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        🍽️ Restaurant Pro
      </div>
      <div className="navbar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
