import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Navbar.css';

function Navbar() {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/menu', icon: '🍽️', label: 'Menu' },
    { path: '/dine-in', icon: '🪑', label: 'Dine-In' },
    { path: '/takeaway', icon: '📦', label: 'Takeaway' },
    { path: '/create-order', icon: '➕', label: 'New Order' },
    { path: '/kitchen', icon: '👨‍🍳', label: 'Kitchen' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-restaurant">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🍽️</span>
          <div className="brand-text">
            <span className="brand-name">Restaurant Pro</span>
            <span className="brand-tagline">Order Management</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <ul className="navbar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          <button className="btn-icon" title="Notifications">
            <span>🔔</span>
          </button>
          <button className="btn-icon" title="Settings">
            <span>⚙️</span>
          </button>
          <div className="user-profile">
            <div className="user-avatar">👤</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
