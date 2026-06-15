import axios from 'axios';

// Railway injects REACT_APP_ env vars at build time via Vercel/Railway env settings
const USER_API    = process.env.REACT_APP_USER_SERVICE_URL    || 'http://localhost:8081';
const PRODUCT_API = process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:8082';
const ORDER_API   = process.env.REACT_APP_ORDER_SERVICE_URL   || 'http://localhost:8083';

const token = () => localStorage.getItem('kc_token');

const withAuth = (config) => {
  const t = token();
  if (t) config.headers = { ...config.headers, Authorization: `Bearer ${t}` };
  return config;
};

export const userApi    = axios.create({ baseURL: USER_API });
export const productApi = axios.create({ baseURL: PRODUCT_API });
export const orderApi   = axios.create({ baseURL: ORDER_API });

[userApi, productApi, orderApi].forEach(inst => {
  inst.interceptors.request.use(withAuth);
  inst.interceptors.response.use(r => r, err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kc_token');
      localStorage.removeItem('kc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  });
});

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => userApi.post('/api/v1/users/register', data),
  login:    (data) => userApi.post('/api/v1/users/login', data),
  getUser:  (id)   => userApi.get(`/api/v1/users/${id}`),
  listUsers:(role) => userApi.get('/api/v1/users', { params: { role } }),
};

// ── Products ─────────────────────────────────────────────────────────────────
export const productService = {
  list:         (params) => productApi.get('/api/v1/products', { params }),
  getById:      (id)     => productApi.get(`/api/v1/products/${id}`),
  listByFarmer: (fid)    => productApi.get(`/api/v1/products/farmer/${fid}`),
  create:       (data)   => productApi.post('/api/v1/products', data),
  update:       (id, d)  => productApi.put(`/api/v1/products/${id}`, d),
  remove:       (id)     => productApi.delete(`/api/v1/products/${id}`),
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const orderService = {
  create:       (data)  => orderApi.post('/api/v1/orders', data),
  myOrders:     ()      => orderApi.get('/api/v1/orders/my'),
  getById:      (id)    => orderApi.get(`/api/v1/orders/${id}`),
  updateStatus: (id, s) => orderApi.patch(`/api/v1/orders/${id}/status`, null, { params: { status: s } }),
};
