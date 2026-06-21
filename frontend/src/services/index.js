import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  selectRole: (role) => api.post('/auth/select-role', { role }),
  getProfile: () => api.get('/auth/profile'),
  verifyOtp: (email, otpCode) => api.post('/auth/verify-otp', { email, otpCode }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
};

export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getSellerProducts: () => api.get('/products/seller'),
  createProduct: (data) => {
    const isFormData = data instanceof FormData;
    return api.post('/products', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  updateProduct: (id, data) => {
    const isFormData = data instanceof FormData;
    return api.put(`/products/${id}`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  deleteProduct: (id) => api.delete(`/products/${id}`),
  uploadProductImage: (formData) => api.post('/products/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const storeService = {
  getMyStore: () => api.get('/stores/my'),
  createStore: (data) => api.post('/stores', data),
  updateStore: (data) => api.put('/stores/my', data),
  getStoreSummary: (id) => api.get(`/stores/${id}`),
  getStoreReviews: (storeId, params) => api.get(`/stores/${storeId}/reviews`, { params }),
  submitStoreReview: (data) => api.post('/orders/review', data),
};

export const reviewService = {
  getReviews: (params) => api.get('/reviews', { params }),
  createReview: (data) => api.post('/reviews', data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

export const walletService = {
  getWallet: () => api.get('/wallet'),
  topup: (amount) => api.post('/wallet/topup', { amount }),
};

export const addressService = {
  getAddresses: () => api.get('/addresses'),
  createAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
  setDefaultAddress: (id) => api.put(`/addresses/${id}/default`),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (productId, quantity) => api.post('/cart/items', { productId, quantity }),
  updateItem: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
  removeItem: (productId) => api.delete(`/cart/items/${productId}`),
  clearCart: () => api.delete('/cart'),
};

export const orderService = {
  checkout: (data) => api.post('/orders/checkout', data),
  getBuyerOrders: () => api.get('/orders/buyer'),
  getSellerOrders: () => api.get('/orders/seller'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status, note) => api.put(`/orders/${id}/status`, { status, note }),
};

export const discountService = {
  getVouchers: () => api.get('/discounts/vouchers'),
  getPromos: () => api.get('/discounts/promos'),
  createVoucher: (data) => api.post('/discounts/vouchers', data),
  createPromo: (data) => api.post('/discounts/promos', data),
  validateDiscount: (code, subtotal) => api.post('/discounts/validate', { code, subtotal }),
};

export const deliveryService = {
  getDriverDashboard: () => api.get('/deliveries/dashboard'),
  getAvailableJobs: () => api.get('/deliveries/available'),
  getJobDetail: (id) => api.get(`/deliveries/${id}`),
  takeJob: (id) => api.post(`/deliveries/${id}/take`),
  completeJob: (id) => api.post(`/deliveries/${id}/complete`),
};

export const adminService = {
  getMetrics: () => api.get('/admin/metrics'),
  getUsers: () => api.get('/admin/users'),
  getLogs: () => api.get('/admin/logs'),
  simulateNextDay: (days) => api.post('/admin/simulate-next-day', { days }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStoreReviews: (params) => api.get('/admin/store-reviews', { params }),
  deleteStoreReview: (id) => api.delete(`/admin/store-reviews/${id}`),
};
