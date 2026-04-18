import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatar: string | null;
  gender: string | null;
  campus: string | null;
  grade: string | null;
  major: string | null;
  interests: string[];
  declaration: string | null;
  creditScore: number;
  roles: string[];
  wingmanCertStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type AppPage = 'login' | 'register' | 'profile-setup' | 'discovery' | 'chat';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  page: AppPage;
  chatRelationshipId: string | null;

  setPage: (page: AppPage) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nickname: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  enterChat: (relationshipId: string) => void;
  exitChat: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  page: 'login',
  chatRelationshipId: null,

  setPage: (page) => set({ page }),

  login: async (email, password) => {
    const res = await apiFetch<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    set({ user: res.user, page: 'discovery', loading: false });
  },

  register: async (email, nickname, password) => {
    const res = await apiFetch<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, nickname, password }),
    });
    set({ user: res.user, page: 'profile-setup', loading: false });
  },

  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    set({ user: null, page: 'login', chatRelationshipId: null });
  },

  fetchMe: async () => {
    try {
      const user = await apiFetch<AuthUser>('/auth/me', { method: 'POST' });
      set({ user, page: 'discovery', loading: false });
    } catch {
      set({ user: null, page: 'login', loading: false });
    }
  },

  updateProfile: async (data) => {
    const updated = await apiFetch<AuthUser>('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    set({ user: updated });
  },

  enterChat: (relationshipId) => {
    set({ chatRelationshipId: relationshipId, page: 'chat' });
  },

  exitChat: () => {
    set({ chatRelationshipId: null, page: 'discovery' });
  },
}));

// Listen for 401 events from apiFetch
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.setState({ user: null, page: 'login', loading: false });
  });
}
