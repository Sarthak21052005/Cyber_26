import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const menuAPI = {
  getAll: (params) => api.get('/menu', { params }),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  toggleAvailability: (id, isAvailable) => api.patch(`/menu/${id}/availability`, { is_available: isAvailable }),
  delete: (id) => api.delete(`/menu/${id}`),
  getCuisines: () => api.get('/menu/cuisines'),
  getCategories: () => api.get('/menu/categories'),
};

export const customerAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  getByPhone: (phone) => api.get(`/customers/phone/${phone}`),
  getOrders: (id) => api.get(`/customers/${id}/orders`),
  getStats: (id) => api.get(`/customers/${id}/stats`),
};

export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getDineIn: (params) => api.get('/orders/dine-in', { params }),
  getTakeaway: (params) => api.get('/orders/takeaway', { params }),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { order_status: status }),
  updateItemStatus: (orderId, itemId, status) => api.patch(`/orders/${orderId}/items/${itemId}/status`, { item_status: status }),
  getActive: () => api.get('/orders/active'),
  cancel: (id) => api.delete(`/orders/${id}`),
};

export const paymentAPI = {
  process: (data) => api.post('/payments', data),
  getById: (id) => api.get(`/payments/${id}`),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
  generateBill: (orderId) => api.get(`/payments/bill/${orderId}`),
  getTodaySummary: () => api.get('/payments/summary/today'),
};

export const reportAPI = {
  getDailySales: (date) => api.get('/reports/daily-sales', { params: { date } }),
  getPopularItems: (params) => api.get('/reports/popular-items', { params }),
  getRevenueByCuisine: (params) => api.get('/reports/revenue-by-cuisine', { params }),
  getPeakHours: (date) => api.get('/reports/peak-hours', { params: { date } }),
  getPaymentMethods: (params) => api.get('/reports/payment-methods', { params }),
  getWeeklyComparison: () => api.get('/reports/weekly-comparison'),
  getOrderStatus: () => api.get('/reports/order-status'),
};

export default api;
