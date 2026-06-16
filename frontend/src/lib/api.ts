import axios from 'axios';

// Uses Vite environment variables if available, otherwise defaults to your local Django server
const BASE_URL = import.meta.env.VITE_API_URL || ``;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - ready for when we integrate authentication
api.interceptors.request.use((config) => {
  // E.g., const token = localStorage.getItem('accessToken');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;