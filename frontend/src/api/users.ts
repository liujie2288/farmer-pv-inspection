import client from './client';

export interface User {
  id: number;
  username: string;
  realName: string;
  phone: string | null;
  role: 'admin' | 'inspector';
  status: number;
  needResetPwd: boolean;
  createTime: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

export interface UserListParams {
  page?: number;
  size?: number;
  keyword?: string;
  role?: string;
  status?: number;
}

export function listUsers(params?: UserListParams) {
  return client.get<any, { code: number; data: PageResult<User> }>('/users', { params });
}

export function createUser(data: {
  username: string;
  password: string;
  realName: string;
  phone?: string;
  role: string;
}) {
  return client.post<any, { code: number; data: { id: number } }>('/users', data);
}

export function updateUser(id: number, data: {
  realName: string;
  phone?: string;
  role: string;
  status: number;
}) {
  return client.put<any, { code: number }>(`/users/${id}`, data);
}

export function deleteUser(id: number) {
  return client.delete<any, { code: number }>(`/users/${id}`);
}

export function toggleUserStatus(id: number, status: number) {
  return client.put<any, { code: number }>(`/users/${id}/status`, { status });
}
