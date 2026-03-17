import { create } from 'zustand';
import api from '../api';
import { connectSocket, disconnectSocket } from '../socket';

export interface AppUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  status: string;
}

interface AuthState {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
  updateUser: (data: Partial<AppUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('ec_token');
    if (!token) { set({ loading: false }); return; }
    try {
      const { data } = await api.get('/me');
      connectSocket(token);
      set({ user: data, token, loading: false });
    } catch {
      localStorage.removeItem('ec_token');
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem('ec_token', data.token);
    connectSocket(data.token);
    set({ user: data.user, token: data.token });
  },

  register: async (username, email, password) => {
    const { data } = await api.post('/register', { username, email, password });
    localStorage.setItem('ec_token', data.token);
    connectSocket(data.token);
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    localStorage.removeItem('ec_token');
    disconnectSocket();
    set({ user: null, token: null });
  },

  updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
}));
