// src/api.ts – Axios instance with base URL & Auth Token interceptor
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000'),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('task_on_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
