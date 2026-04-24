import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    const data = response.data;
    if (data.code && data.code !== 200 && data.code !== 201) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config.url || '';
      if (!url.startsWith('/auth/login')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || '无权限访问';
      return Promise.reject(new Error(message));
    }
    const message = error.response?.data?.message || '网络错误，请稍后重试';
    return Promise.reject(new Error(message));
  }
);

export default client;
