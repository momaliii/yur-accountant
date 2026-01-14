import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth/authService.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Initialize from localStorage
      initialize: async () => {
        const token = authService.getToken();
        const user = authService.getUser();
        
        if (token && user) {
          try {
            // Verify token is still valid
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              set({
                user: currentUser,
                token,
                isAuthenticated: true,
              });
            } else {
              authService.logout();
              set({
                user: null,
                token: null,
                isAuthenticated: false,
              });
            }
          } catch (error) {
            authService.logout();
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return response;
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (email, password, name, planSlug = null, billingCycle = 'monthly') => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(email, password, name, planSlug, billingCycle);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return response;
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        // Clear local IndexedDB data when logging out to prevent data mixing
        try {
          const { backupDB } = await import('../services/db/database.js');
          await backupDB.clearAll();
          console.log('Local data cleared on logout');
        } catch (error) {
          console.error('Error clearing local data on logout:', error);
        }
        
        // Clear last user ID
        localStorage.removeItem('lastUserId');
        
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      isAdmin: () => {
        const user = get().user;
        return user?.role === 'admin';
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
        localStorage.setItem('user', JSON.stringify({ ...get().user, ...userData }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
