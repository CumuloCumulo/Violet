import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  contactEmail: string | null;
  nickname: string;
  avatar: string | null;
  gender: string | null;
  campus: string | null;
  grade: string | null;
  major: string | null;
  interests: string[];
  declaration: string | null;
  cardImage: string | null;
  wechat: string | null;
  qq: string | null;
  phone: string | null;
  creditScore: number;
  roles: string[];
  wingmanCertStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nickname: string, password: string, code: string) => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const res = await apiFetch<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    set({ user: res.user, loading: false });
  },

  register: async (email, nickname, password, code) => {
    const res = await apiFetch<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, nickname, password, code }),
    });
    set({ user: res.user, loading: false });
  },

  sendCode: async (email) => {
    await apiFetch('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email, code, newPassword) => {
    await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    set({ user: null });
  },

  fetchMe: async () => {
    try {
      const user = await apiFetch<AuthUser>('/auth/me', { method: 'POST' });
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  updateProfile: async (data) => {
    const updated = await apiFetch<AuthUser>('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    set({ user: updated });
  },
}));

// Listen for 401 events from apiFetch
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.setState({ user: null, loading: false });
  });
}
