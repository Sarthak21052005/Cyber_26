import { useState, useEffect } from 'react';
import { menuAPI } from '../../services/api';
import MenuCard from './MenuCard';
import '../../styles/Menu.css';
import '../../styles/Global.css';

function MenuList() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [loading, setLoading] = useState(true);

  const cuisines = [
    'all',
    'north-indian',
    'south-indian',
    'chinese',
    'italian',
    'continental',
    'desserts',
    'beverages',
    'starters'
  ];

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
      console.log('Menu items fetched:', response.data.data);
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
        alert('Failed to delete item');
      }
    }
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      console.log('Toggling availability - ID:', id, 'Current:', currentStatus, 'New:', !currentStatus);
      await menuAPI.toggleAvailability(id, !currentStatus);
      fetchMenuItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability');
    }
  };

  if (loading) {
    return <div className="loading">Loading menu items...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Here is the Menu </h1>
      </div>
      <div className="filter-container">
        {cuisines.map((cuisine) => (
          <button
            key={cuisine}
            className={`filter-btn ${selectedCuisine === cuisine ? 'active' : ''}`}
            onClick={() => setSelectedCuisine(cuisine)}
          >
            {cuisine.toUpperCase().replace('-', ' ')}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <h3>No items found</h3>
          <p>Try selecting a different cuisine</p>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map((item) => (
            <MenuCard
              key={item.menu_id}
              item={item}
              onDelete={handleDelete}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MenuList;
