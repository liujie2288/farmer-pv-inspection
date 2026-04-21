import client from './client';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  userId: number;
  username: string;
  realName: string;
  role: 'admin' | 'inspector';
  firstLogin: boolean;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

export function login(params: LoginParams) {
  return client.post<any, { code: number; data: LoginResult }>('/auth/login', params);
}

export function changePassword(params: ChangePasswordParams) {
  return client.post<any, { code: number }>('/auth/change-password', params);
}

export function resetPassword(userId: number) {
  return client.post<any, { code: number }>('/auth/reset-password', { userId });
}
