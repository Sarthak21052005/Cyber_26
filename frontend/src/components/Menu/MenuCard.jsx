import React from 'react';

function MenuCard({ item, onEdit, onDelete, onToggleAvailability }) {
  return (
    <div className={`menu-card ${!item.is_available ? 'unavailable' : ''}`}>
      <div className="menu-card-header">
        <h3>{item.item_name}</h3>
        <span className={`availability-badge ${item.is_available ? 'available' : 'unavailable'}`}>
          {item.is_available ? 'Available' : 'Unavailable'}
        </span>
      </div>
      
      <p className="menu-description">{item.description}</p>
      
      <div className="menu-tags">
        <span className="tag cuisine-tag">{item.cuisine}</span>
        <span className="tag category-tag">{item.category}</span>
      </div>
      
      <div className="menu-card-footer">
        <div className="price-prep">
          <span className="price">₹{item.price}</span>
          <span className="prep-time">{item.preparation_time} min</span>
        </div>
        
        <div className="menu-actions">
          <button className="btn-icon" onClick={() => onEdit(item)} title="Edit">✏️</button>
          <button 
            className="btn-icon" 
            onClick={() => onToggleAvailability(item.menu_id, item.is_available)}
            title="Toggle Availability"
          >
            {item.is_available ? '🔴' : '🟢'}
          </button>
          <button className="btn-icon" onClick={() => onDelete(item.menu_id)} title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  );
}

export default MenuCard;
