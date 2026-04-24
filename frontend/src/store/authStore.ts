import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logout as apiLogout } from '@/api/auth';
import type { UserInfo } from '@/api/auth';

interface AuthState {
  user: UserInfo | null;
  setUser: (user: UserInfo) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        try { await apiLogout(); } catch {}
        set({ user: null });
      },
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'pv-auth-storage',
    }
  )
);
