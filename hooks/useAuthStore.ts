import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '@/services/authService';
import { User, Credentials, RegisterData } from '@/services/types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      loading: true,
      hydrated: false,

      login: async (credentials: Credentials) => {
        const response = await authService.login(credentials);
        set({
          isAuthenticated: true,
          user: response.user,
        });
      },

      register: async (userData: RegisterData) => {
        const response = await authService.register(userData);
        set({
          isAuthenticated: true,
          user: response.user,
        });
      },

      logout: async () => {
        await authService.logout();
        set({
          isAuthenticated: false,
          user: null,
        });
      },

      checkAuth: async () => {
        const authenticated = await authService.isAuthenticated();
        set({ isAuthenticated: authenticated, loading: false });
        return authenticated;
      },

      setLoading: (loading: boolean) => set({ loading }),

      setHydrated: (hydrated: boolean) => set({ hydrated }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
