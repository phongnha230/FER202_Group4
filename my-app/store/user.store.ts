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
        const { data: initialProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        let profile = initialProfile;

        // If profile missing, try to create it or just use session data
        if (!profile || error) {
             console.warn("Profile missing. Attempting to create or use fallback.");
             // Attempt lazy create
             const newProfile = {
                 id: session.user.id,
                 full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
                 avatar_url: session.user.user_metadata.avatar_url || '',
                 role: 'customer'
             };
             
             const { error: insertError } = await supabase.from('profiles').insert(newProfile);
             if (!insertError) {
                 profile = newProfile;
             } else {
                 console.error("Failed to create profile lazy:", insertError);
                 // Fallback to minimal user object
                 profile = {
                     id: session.user.id,
                     full_name: session.user.user_metadata.full_name,
                     role: 'customer',
                     avatar_url: session.user.user_metadata.avatar_url,
                     created_at: new Date().toISOString(),
                     phone: null,
                     address: null
                 };
             }
        }

        if (profile) {
           set({ 
            user: { ...profile, email: session.user.email! }, 
            isAuthenticated: true, 
            role: profile.role,
            isLoading: false 
          });

          // Sync local cart to Supabase (if any items exist)
          try {
            const { syncLocalCartToSupabase } = await import('@/services/cart-sync.service');
            await syncLocalCartToSupabase(session.user.id);
          } catch (syncError) {
             console.error("Cart sync failed", syncError);
          }

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
