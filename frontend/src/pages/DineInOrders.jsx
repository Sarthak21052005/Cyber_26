import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';

function DineInOrders() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      const params = { order_type: 'dine-in' };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const res = await orderAPI.getAll(params);
      setOrders(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, status);
      loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f093fb',
      'preparing': '#4facfe',
      'ready': '#43e97b',
      'completed': '#11998e',
      'cancelled': '#eb3349'
    };
    return colors[status] || '#95a5a6';
  };

  const getTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Loading orders...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>🍽️ Dine-in Orders</h1>
        <Link to="/create-order" className="btn btn-primary">
          ➕ New Dine-in Order
        </Link>
      </div>

      <div className="filter-container">
        {['all', 'pending', 'preparing', 'ready', 'completed'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>No Dine-in Orders</h3>
          <p>Create a new dine-in order to get started</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.order_id} className="order-card fade-in">
              <div className="order-header">
                <div>
                  <h3>Order #{order.order_token || order.order_id}</h3>
                  <p className="order-info">
                    <strong>Table {order.table_number}</strong> • {order.customer_name || 'Walk-in'}
                  </p>
                  <p className="order-time">
                    ⏱️ {getTimeAgo(order.created_at)}
                  </p>
                </div>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.order_status) }}
                >
                  {order.order_status}
                </div>
              </div>

              <div className="order-details">
                <span><strong>Total:</strong> ₹{parseFloat(order.total_amount).toFixed(2)}</span>
                <span><strong>Phone:</strong> {order.customer_phone || 'N/A'}</span>
              </div>

              {order.special_instructions && (
                <div className="special-instructions">
                  <strong>📝 Note:</strong> {order.special_instructions}
                </div>
              )}

              <div className="order-actions">
                {order.order_status === 'pending' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => updateStatus(order.order_id, 'preparing')}
                  >
                    🔥 Start Preparing
                  </button>
                )}
                {order.order_status === 'preparing' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => updateStatus(order.order_id, 'ready')}
                  >
                    ✅ Mark Ready
                  </button>
                )}
                {order.order_status === 'ready' && (
                  <Link 
                    to={`/payment/${order.order_id}`}
                    className="btn btn-success"
                  >
                    💰 Generate Bill
                  </Link>
                )}
                {order.order_status !== 'completed' && order.order_status !== 'cancelled' && (
                  <button 
                    className="btn btn-warning"
                    onClick={() => {
                      if (window.confirm('Cancel this order?')) {
                        orderAPI.cancel(order.order_id).then(loadOrders);
                      }
                    }}
                  >
                    ❌ Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DineInOrders;
