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
        // If profile missing, try to create it or just use session data
        if (!profile || error) {
             console.warn("Profile missing or error fetching. Attempting to create or use fallback.", error);
             
             // First check: did we fail due to permissions?
             if (error?.code === '42501') {
                 console.error("Permission denied fetching profile. Check RLS policies and table grants.");
             }

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
                 // Check if it's a duplicate key error (profile already created by trigger or race condition)
                 if (insertError.code === '23505') {
                     // Try fetching again, explicitly ensuring we can read it
                     const { data: existingProfile, error: retryError } = await supabase
                        .from('profiles')
                        .select('id, full_name, role, avatar_url, created_at') // Select specific columns to avoid permission issues with others
                        .eq('id', session.user.id)
                        .single();
                     
                     if (existingProfile) {
                         profile = existingProfile;
                     } else {
                        console.error("Retry fetch failed:", retryError);
                     }
                 } else {
                     console.error("Failed to create profile lazy:", JSON.stringify(insertError, null, 2));
                     // Fallback to minimal user object using session data
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
