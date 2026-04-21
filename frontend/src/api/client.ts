import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    const data = response.data;
    if (data.code && data.code !== 200) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || '网络错误，请稍后重试';
    return Promise.reject(new Error(message));
  }
);

export default client;
