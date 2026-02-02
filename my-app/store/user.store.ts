import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { UserState } from '@/types/user.type';

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  role: null,

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch profile to get role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && !error) {
           set({ 
            user: { ...profile, email: session.user.email! }, 
            isAuthenticated: true, 
            role: profile.role,
            isLoading: false 
          });
          return;
        }
      }
      
      set({ user: null, isAuthenticated: false, role: null, isLoading: false });

    } catch (error) {
      console.error('Session check failed', error);
      set({ user: null, isAuthenticated: false, role: null, isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, role: null });
  }
}));
