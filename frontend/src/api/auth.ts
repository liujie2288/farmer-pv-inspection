import client from './client';

export interface LoginParams {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  realName: string;
  phone: string;
  role: 'admin' | 'inspector';
  needResetPwd: boolean;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export function login(params: LoginParams) {
  return client.post<any, { code: number }>('/auth/login', params);
}

export function getCurrentUser() {
  return client.get<any, { code: number; data: UserInfo }>('/auth/me');
}

export function changePassword(params: ChangePasswordParams) {
  return client.post<any, { code: number }>('/auth/change-password', params);
}

export function resetPassword(userId: number) {
  return client.post<any, { code: number }>('/auth/reset-password', { userId });
}

export function logout() {
  return client.post<any, { code: number }>('/auth/logout');
}
