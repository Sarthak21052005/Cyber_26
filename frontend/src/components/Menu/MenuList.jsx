import React, { useState, useEffect } from 'react';
import { menuAPI } from '../../services/api';
import MenuCard from './MenuCard';  // ← FIXED PATH
import MenuForm from './MenuForm';
// import './Menu.css';

function MenuList() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const cuisines = ['all', 'north-indian', 'south-indian', 'chinese', 'italian', 'continental', 'desserts', 'beverages', 'starters'];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (selectedCuisine === 'all') {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(menuItems.filter(item => item.cuisine === selectedCuisine));
    }
  }, [selectedCuisine, menuItems]);

  const fetchMenuItems = async () => {
    try {
      const response = await menuAPI.getAll();
      setMenuItems(response.data.data);
      setFilteredItems(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await menuAPI.delete(id);
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      await menuAPI.toggleAvailability(id, !currentStatus);
      fetchMenuItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditItem(null);
    fetchMenuItems();
  };

  if (loading) return <div className="loading">Loading menu...</div>;

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>Menu Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Add New Item</button>
      </div>

      <div className="cuisine-filter">
        {cuisines.map(cuisine => (
          <button
            key={cuisine}
            className={`filter-btn ${selectedCuisine === cuisine ? 'active' : ''}`}
            onClick={() => setSelectedCuisine(cuisine)}
          >
            {cuisine.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filteredItems.map(item => (
          <MenuCard
            key={item.menu_id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
          />
        ))}
      </div>

      {showForm && (
        <MenuForm
          item={editItem}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

export default MenuList;
