import { useState, useEffect } from 'react';
import { reportAPI, orderAPI } from '../services/api';
import '../styles/Dashboard.css';
import '../styles/Global.css';

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
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today's Orders</h3>
          <div className="value">{orderStats?.total || 0}</div>
          <div className="label">Total orders today</div>
        </div>

        <div className="stat-card">
          <h3>Today's Revenue</h3>
          <div className="value">₹{sales?.total_revenue || '0.00'}</div>
          <div className="label">Total revenue</div>
        </div>

        <div className="stat-card">
          <h3>Pending Orders</h3>
          <div className="value">{orderStats?.pending || 0}</div>
          <div className="label">Need attention</div>
        </div>

        <div className="stat-card">
          <h3>Completed Today</h3>
          <div className="value">{orderStats?.completed || 0}</div>
          <div className="label">Successfully completed</div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="dashboard-section">
        <h2>🔥 Popular Items Today</h2>
        <div className="popular-items">
          {popular.length > 0 ? (
            popular.map((item, index) => (
              <div key={index} className="popular-item-card">
                <div className="item-rank">#{index + 1}</div>
                <div className="item-info">
                  <h4>{item.item_name}</h4>
                  <p>{item.total_orders} orders</p>
                </div>
                <div className="item-revenue">₹{item.total_revenue}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">No data available</div>
          )}
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="dashboard-section">
        <h2>📈 Revenue by Category</h2>
        <div className="revenue-grid">
          {revenueByCategory.length > 0 ? (
            revenueByCategory.map((cat, index) => (
              <div key={index} className="revenue-card">
                <h4>{cat.cuisine || cat.category}</h4>
                <div className="revenue-value">₹{cat.total_revenue}</div>
                <div className="revenue-meta">{cat.total_orders} orders</div>
              </div>
            ))
          ) : (
            <div className="empty-state">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashBoard;
