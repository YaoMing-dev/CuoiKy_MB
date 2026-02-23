import { create } from 'zustand';

const useLocationStore = create((set) => ({
  location: null,
  errorMsg: null,
  isLoading: false,

  setLocation: (location) => set({ location, errorMsg: null }),
  setError: (errorMsg) => set({ errorMsg, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export default useLocationStore;
