import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('mc_user') || 'null'),
  token: localStorage.getItem('mc_token') || null,
  isAuthenticated: !!localStorage.getItem('mc_token'),

  setAuth: (user, token) => {
    localStorage.setItem('mc_token', token);
    localStorage.setItem('mc_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates) =>
    set((state) => {
      const updated = { ...state.user, ...updates };
      localStorage.setItem('mc_user', JSON.stringify(updated));
      return { user: updated };
    }),
}));

export default useAuthStore;
