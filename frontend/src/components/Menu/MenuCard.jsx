import React from 'react';

function MenuCard({ item, onDelete, onToggleAvailability }) {
  return (
    <div className="menu-card">
      <div className="menu-card-body">
        <h3>{item.item_name}</h3>
        <p>{item.description}</p>

        <div className="menu-tags">
          <span className="tag tag-cuisine">{item.cuisine}</span>
          <span className="tag tag-category">{item.category}</span>
        </div>

        <div className="menu-footer">
          <div className="price">₹{item.price}</div>
          
          {/* Use menu_id instead of item_id */}
          <button
            className={`btn-availability ${item.is_available ? 'available' : 'unavailable'}`}
            onClick={() => onToggleAvailability(item.menu_id, item.is_available)}
            title={item.is_available ? 'Mark as Unavailable' : 'Mark as Available'}
          >
            {item.is_available ? '✓ Available' : '✗ Unavailable'}
          </button>

          {/* Delete Button - Use menu_id */}
          <button
            className="btn-icon-danger"
            onClick={() => onDelete(item.menu_id)}
            title="Delete Item"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuCard;
