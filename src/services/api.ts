import axios from 'axios';

// This is the base URL for your Django backend.
// In development, you might use 'http://localhost:8000/api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors if needed (e.g., for JWT tokens from Django)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials: any) => api.post('/auth/login/', credentials),
  register: (userData: any) => api.post('/auth/register/', userData),
};

export const productService = {
  getProducts: () => api.get('/products/'),
  createProduct: (productData: any) => api.post('/products/', productData),
  updateProduct: (id: number, productData: any) => api.put(`/products/${id}/`, productData),
  deleteProduct: (id: number) => api.delete(`/products/${id}/`),
};

export const salesService = {
  getSales: () => api.get('/sales/'),
};

export default api;
