import { supabaseAdmin } from '@/lib/supabase/admin';

export interface ChatSession {
  id: string;
  user_id: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string | null;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}

export async function createSession(userId: string | null): Promise<{ id: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('ai_chat_sessions')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (error) {
    console.error('createSession error:', error);
    return null;
  }
  return data;
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const { data, error } = await supabaseAdmin
    .from('ai_chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabaseAdmin
    .from('ai_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data || [];
}

export async function insertMessage(
  sessionId: string,
  userId: string | null,
  sender: 'user' | 'ai',
  message: string
): Promise<ChatMessage | null> {
  const { data, error } = await supabaseAdmin
    .from('ai_chat_messages')
    .insert({ session_id: sessionId, user_id: userId, sender, message })
    .select()
    .single();

  if (error) {
    console.error('insertMessage error:', error);
    return null;
  }
  return data;
}
