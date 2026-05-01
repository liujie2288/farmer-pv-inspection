import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(client(config));
    }
  });
  failedQueue = [];
}

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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest?.url || '';

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (url.startsWith('/auth/login') || url.startsWith('/auth/refresh') || url.startsWith('/auth/logout')) {
        useAuthStore.getState().setUser(null as any);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post('/api/auth/refresh', null, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        });
        processQueue(null);
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthStore.getState().setUser(null as any);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      const data = error.response.data as { message?: string } | undefined;
      const message = data?.message || '无权限访问';
      return Promise.reject(new Error(message));
    }

    if (error.response?.status === 429) {
      const data = error.response.data as { message?: string } | undefined;
      const message = data?.message || '请求过于频繁，请稍后再试';
      return Promise.reject(new Error(message));
    }

    const data = error.response?.data as { message?: string } | undefined;
    const message = data?.message || '网络错误，请稍后重试';
    return Promise.reject(new Error(message));
  }
);

export default client;
