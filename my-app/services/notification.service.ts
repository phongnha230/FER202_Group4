import { supabaseAdmin } from '@/lib/supabase/admin';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Create an in-app notification for a user.
 * Uses service role to bypass RLS (no INSERT policy for users).
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'info'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
    });

    if (error) {
      console.error('Notification create error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error('Notification create error:', err);
    return { success: false, error: err.message };
  }
}
