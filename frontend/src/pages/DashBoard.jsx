import { useState, useEffect } from 'react';
import { reportAPI, orderAPI } from '../services/api';

function DashBoard() {
  const [sales, setSales] = useState(null);
  const [popular, setPopular] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [salesRes, popularRes, cuisineRes, ordersRes] = await Promise.all([
        reportAPI.getDailySales(),
        reportAPI.getPopularItems(),
        reportAPI.getRevenueByCuisine(),
        orderAPI.getAll()
      ]);

      setSales(salesRes.data.data);
      setPopular(popularRes.data.data.slice(0, 5));
      setRevenueByCategory(cuisineRes.data.data);

      const todayOrders = ordersRes.data.data.filter(
        order => new Date(order.order_date).toDateString() === new Date().toDateString()
      );

      setOrderStats({
        total: todayOrders.length,
        pending: todayOrders.filter(o => o.order_status === 'pending').length,
        preparing: todayOrders.filter(o => o.order_status === 'preparing').length,
        ready: todayOrders.filter(o => o.order_status === 'ready').length,
        completed: todayOrders.filter(o => o.order_status === 'completed').length,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid - FIXED */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today's Revenue</h3>
          <div className="value">₹{sales?.total_revenue || 0}</div>
          <div className="label">{sales?.total_orders || 0} orders</div>
        </div>

        <div className="stat-card">
          <h3>Total Orders</h3>
          <div className="value">{orderStats?.total || 0}</div>
          <div className="label">Today</div>
        </div>

        <div className="stat-card">
          <h3>Pending</h3>
          <div className="value">{orderStats?.pending || 0}</div>
          <div className="label">Orders</div>
        </div>

        <div className="stat-card">
          <h3>Preparing</h3>
          <div className="value">{orderStats?.preparing || 0}</div>
          <div className="label">Orders</div>
        </div>

        <div className="stat-card">
          <h3>Ready</h3>
          <div className="value">{orderStats?.ready || 0}</div>
          <div className="label">Orders</div>
        </div>

        <div className="stat-card">
          <h3>Completed</h3>
          <div className="value">{orderStats?.completed || 0}</div>
          <div className="label">Orders</div>
        </div>
      </div>

      {/* Revenue by Cuisine */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>💰 Revenue by Cuisine</h2>
        {revenueByCategory.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {revenueByCategory.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{item.cuisine}</span>
                <span style={{ fontWeight: '700', color: '#6366f1' }}>₹{item.total_revenue}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No data available</p>
        )}
      </div>

      {/* Popular Items */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>🔥 Popular Items</h2>
        {popular.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {popular.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{item.item_name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{item.total_quantity} sold</div>
                </div>
                <div style={{ fontWeight: '700', color: '#6366f1' }}>₹{item.total_revenue}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No data available</p>
        )}
      </div>
    </div>
  );
}

export default DashBoard;
