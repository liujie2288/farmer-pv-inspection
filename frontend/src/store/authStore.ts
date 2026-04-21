import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: number;
  username: string;
  realName: string;
  role: 'admin' | 'inspector';
  firstLogin: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'pv-auth-storage',
    }
  )
);
