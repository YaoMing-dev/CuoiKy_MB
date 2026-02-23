import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setUserProfile: (userProfile) => set({ userProfile }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      userProfile: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

export default useAuthStore;
