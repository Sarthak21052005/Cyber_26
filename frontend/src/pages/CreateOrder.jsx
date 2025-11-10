import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI, orderAPI } from '../services/api';

function CreateOrder() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const res = await menuAPI.getAll({ available: 'true' });
      setMenu(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading menu:', error);
      setLoading(false);
    }
  };

  const cuisines = ['all', 'north-indian', 'south-indian', 'chinese', 'italian', 'starters', 'desserts', 'beverages'];
  
  const filteredMenu = selectedCuisine === 'all' 
    ? menu 
    : menu.filter(item => item.cuisine === selectedCuisine || item.category === selectedCuisine);

  const addToCart = (item) => {
    const existing = cart.find(c => c.menu_id === item.menu_id);
    if (existing) {
      setCart(cart.map(c => 
        c.menu_id === item.menu_id 
          ? { ...c, quantity: c.quantity + 1 } 
          : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, customization: '' }]);
    }
  };

  const updateQty = (menuId, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(c => c.menu_id !== menuId));
    } else {
      setCart(cart.map(c => 
        c.menu_id === menuId 
          ? { ...c, quantity: qty } 
          : c
      ));
    }
  };

  const updateCustomization = (menuId, customization) => {
    setCart(cart.map(c => 
      c.menu_id === menuId 
        ? { ...c, customization } 
        : c
    ));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.05;
  const serviceCharge = orderType === 'dine-in' ? subtotal * 0.10 : 0;
  const total = subtotal + gst + serviceCharge;

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert('⚠️ Cart is empty! Add items first.');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber) {
      alert('⚠️ Please enter table number!');
      return;
    }
    if (!customerName.trim()) {
      alert('⚠️ Please enter customer name!');
      return;
    }
    if (!customerPhone.trim()) {
      alert('⚠️ Please enter customer phone number!');
      return;
    }

    try {
      const response = await orderAPI.create({
        customer: {
          name: customerName,
          phone: customerPhone
        },
        order_type: orderType,
        table_number: orderType === 'dine-in' ? parseInt(tableNumber) : null,
        special_instructions: specialInstructions || null,
        items: cart.map(c => ({
          menu_id: c.menu_id,
          quantity: c.quantity,
          customization: c.customization || null
        }))
      });

      const orderToken = response.data.data.order_token;
      alert(`✅ Order created successfully!\n\n🎫 Token: ${orderToken}\n💰 Total: ₹${total.toFixed(2)}`);
      
      if (orderType === 'dine-in') {
        navigate('/dine-in');
      } else {
        navigate('/takeaway');
      }
    } catch (error) {
      alert('❌ Failed to create order: ' + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Loading menu...</div>;

  return (
    <div className="create-order-page">
      <div className="order-content">
        <div className="order-form-section">
          <h1>➕ Create New Order</h1>

          {/* Order Type */}
          <div className="order-type-toggle">
            <button 
              className={orderType === 'dine-in' ? 'active' : ''}
              onClick={() => setOrderType('dine-in')}
            >
              🍽️ Dine In
            </button>
            <button 
              className={orderType === 'takeaway' ? 'active' : ''}
              onClick={() => setOrderType('takeaway')}
            >
              📦 Takeaway
            </button>
          </div>

          {/* Customer Info */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>👤 Customer Details</h3>
            <div className="form-group">
              <input
                type="text"
                placeholder="Customer Name *"
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                type="tel"
                placeholder="Phone Number *"
                className="form-control"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            {orderType === 'dine-in' && (
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Table Number *"
                  className="form-control"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  min="1"
                />
              </div>
            )}
            <div className="form-group">
              <textarea
                placeholder="Special Instructions (optional)"
                className="form-control"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows="2"
              />
            </div>
          </div>

          {/* Menu Items */}
          <h3>🍽️ Select Items</h3>
          <div className="filter-container">
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
            {filteredMenu.map(item => (
              <div key={item.menu_id} className="menu-card">
                <div className="menu-card-body">
                  <h3>{item.item_name}</h3>
                  <p>{item.description?.substring(0, 60)}...</p>
                  <div className="menu-tags">
                    <span className="tag tag-cuisine">{item.cuisine}</span>
                    <span className="tag tag-category">{item.category}</span>
                  </div>
                  <div className="menu-footer">
                    <span className="price">₹{item.price}</span>
                    <button 
                      className="btn btn-success"
                      onClick={() => addToCart(item)}
                    >
                      Add +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="cart-sidebar">
          <h2>🛒 Cart ({cart.length})</h2>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <div style={{ fontSize: '4rem' }}>🛒</div>
              <p>Cart is empty</p>
              <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                Add items from the menu
              </p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.menu_id} className="cart-item">
                    <div className="cart-item-header">
                      <h4>{item.item_name}</h4>
                      <button 
                        className="btn-remove"
                        onClick={() => updateQty(item.menu_id, 0)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="quantity-controls">
                      <button onClick={() => updateQty(item.menu_id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQty(item.menu_id, item.quantity + 1)}>+</button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Extra spicy, No onions"
                      className="form-control"
                      style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
                      value={item.customization}
                      onChange={(e) => updateCustomization(item.menu_id, e.target.value)}
                    />
                    <p style={{ fontWeight: 'bold', marginTop: '0.75rem', fontSize: '1.1rem' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <div className="cart-summary">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary">
                  <span>GST (5%):</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                {orderType === 'dine-in' && (
                  <div className="cart-summary">
                    <span>Service (10%):</span>
                    <span>₹{serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="cart-total">
                  <h3>Total:</h3>
                  <h3>₹{total.toFixed(2)}</h3>
                </div>
                <button 
                  className="btn-checkout"
                  onClick={placeOrder}
                >
                  🎯 Place Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateOrder;
