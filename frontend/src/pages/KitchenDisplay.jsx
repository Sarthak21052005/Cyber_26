import { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import '../styles/Kitchen.css';
import '../styles/Global.css';

function KitchenDisplay() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadActiveOrders();
    
    if (autoRefresh) {
      const interval = setInterval(loadActiveOrders, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadActiveOrders = async () => {
    try {
      const res = await orderAPI.getActive();
      setActiveOrders(res.data.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      loadActiveOrders();
      
      // Play sound notification
      playNotificationSound();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVa3n8LJgHAU7k9r00H0pByV3yO7ejUIKEl+16+mnVRUKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmUgND1Wt5/CyYBwFO5Pa9NB9KQcld8ju3o1CChJfteunsVUVCkaf4PK+bCEFMYfR89OCMwYebsDv45lIDQ9VrefwsmAcBTuT2vTQfSkHJXfI7t6NQgoSX7Xrp7FVFQpGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVa3n8LJgHAU7k9r00H0pByV3yO7ejUIKEl+166exVRUKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmUgND1Wt5/CyYBwFO5Pa9NB9KQcld8ju3o1CChJfteunsVUVCkaf4PK+bCEFMYfR89OCMwYebsDv45lIDQ9Vrefwsmaccount');
  };

  const getOrderAge = (createdAt) => {
    const minutes = Math.floor((new Date() - new Date(createdAt)) / 60000);
    return minutes;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f093fb',
      'preparing': '#4facfe',
      'ready': '#43e97b'
    };
    return colors[status] || '#95a5a6';
  };

  const getAgeColor = (minutes) => {
    if (minutes < 10) return '#43e97b'; // Green
    if (minutes < 20) return '#f5a623'; // Orange
    return '#e74c3c'; // Red
  };

  return (
    <div className="kitchen-display">
      {/* KDS Header */}
      <div className="kds-header">
        <div>
          <h1>👨‍🍳 Kitchen Display System</h1>
          <p>Active Orders: {activeOrders.length}</p>
        </div>
        <div className="kds-controls">
          <button 
            className={`btn ${autoRefresh ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
          </button>
          <button className="btn btn-primary" onClick={loadActiveOrders}>
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* Order Status Tabs */}
      <div className="kds-tabs">
        <div className="tab">Pending ({activeOrders.filter(o => o.order_status === 'pending').length})</div>
        <div className="tab">Preparing ({activeOrders.filter(o => o.order_status === 'preparing').length})</div>
        <div className="tab">Ready ({activeOrders.filter(o => o.order_status === 'ready').length})</div>
      </div>

      {/* Orders Grid */}
      <div className="kds-orders-grid">
        {activeOrders.length === 0 ? (
          <div className="empty-kds">
            <h2>✅ All Caught Up!</h2>
            <p>No pending orders</p>
          </div>
        ) : (
          activeOrders.map(order => {
            const age = getOrderAge(order.created_at);
            const isUrgent = age > 15;

            return (
              <div 
                key={order.order_id} 
                className={`kds-order-card ${isUrgent ? 'urgent' : ''}`}
                style={{ borderLeftColor: getStatusColor(order.order_status) }}
              >
                {/* Order Header */}
                <div className="kds-order-header">
                  <div>
                    <h2>Order #{order.order_id}</h2>
                    <p>{order.order_type === 'dine-in' ? `🍽️ Table ${order.table_number}` : '📦 Takeaway'}</p>
                    {order.customer_name && <p>👤 {order.customer_name}</p>}
                  </div>
                  
                  <div className="order-timer" style={{ color: getAgeColor(age) }}>
                    <span className="timer-value">{age}</span>
                    <span className="timer-label">min</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="kds-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="kds-item">
                      <div className="item-quantity">{item.quantity}×</div>
                      <div className="item-details">
                        <div className="item-name">{item.item_name}</div>
                        {item.special_instructions && (
                          <div className="item-note">📝 {item.special_instructions}</div>
                        )}
                        <div className="item-prep-time">⏱️ {item.preparation_time || 15} min</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="kds-actions">
                  {order.order_status === 'pending' && (
                    <button 
                      className="kds-btn kds-btn-start"
                      onClick={() => updateStatus(order.order_id, 'preparing')}
                    >
                      🔥 Start Cooking
                    </button>
                  )}
                  
                  {order.order_status === 'preparing' && (
                    <button 
                      className="kds-btn kds-btn-ready"
                      onClick={() => updateStatus(order.order_id, 'ready')}
                    >
                      ✅ Mark Ready
                    </button>
                  )}
                  
                  {order.order_status === 'ready' && (
                    <button 
                      className="kds-btn kds-btn-complete"
                      onClick={() => updateStatus(order.order_id, 'completed')}
                    >
                      📤 Served
                    </button>
                  )}
                </div>

                {/* Urgency Indicator */}
                {isUrgent && (
                  <div className="urgency-badge">
                    🔔 URGENT!
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default KitchenDisplay;
