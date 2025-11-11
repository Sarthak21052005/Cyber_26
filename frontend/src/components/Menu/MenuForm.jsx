import { useState, useEffect } from 'react';
import { menuAPI } from '../../services/api';
import '../../styles/Forms.css';
import '../../styles/Global.css';

// ... rest of your MenuForm.jsx code remains the same


function MenuForm({ item, onClose }) {
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    category: 'main',
    cuisine: 'north-indian',
    price: '',
    preparation_time: '',
    is_available: true,
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (item) {
        await menuAPI.update(item.menu_id, formData);
      } else {
        await menuAPI.create(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Error saving menu item');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{item ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name *</label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="appetizer">Appetizer</option>
                <option value="main">Main</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cuisine *</label>
              <select name="cuisine" value={formData.cuisine} onChange={handleChange} required>
                <option value="north-indian">North Indian</option>
                <option value="south-indian">South Indian</option>
                <option value="chinese">Chinese</option>
                <option value="italian">Italian</option>
                <option value="continental">Continental</option>
                <option value="desserts">Desserts</option>
                <option value="beverages">Beverages</option>
                <option value="starters">Starters</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Preparation Time (min)</label>
              <input
                type="number"
                name="preparation_time"
                value={formData.preparation_time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
              />
              Available
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{item ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MenuForm;
