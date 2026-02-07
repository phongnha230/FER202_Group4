'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/store/user.store';

export default function DebugCart() {
    const { user } = useUserStore();
    const [status, setStatus] = useState('Idle');

    const testInsert = async () => {
        if (!user) {
            setStatus('No user logged in');
            return;
        }

        setStatus('Testing insert...');
        try {
            // 1. Check existing
            const { data: existing, error: fetchErr } = await supabase
                .from('carts')
                .select('*')
                .eq('user_id', user.id);

            if (fetchErr) {
                setStatus(`Fetch Error: ${fetchErr.message} (${fetchErr.code})`);
                return;
            }

            if (existing && existing.length > 0) {
                setStatus(`Cart exists: ${existing[0].id}`);
                return;
            }

            // 2. Try Insert
            const { data, error } = await supabase
                .from('carts')
                .insert({ user_id: user.id })
                .select()
                .single();

            if (error) {
                setStatus(`Insert Error: ${error.message} (${error.code}) - Details: ${error.details || 'none'}`);
            } else {
                setStatus(`Success! Created cart: ${data.id}`);
            }

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setStatus(`Crash: ${message}`);
        }
    };

    return (
        <div className="p-4 bg-gray-100 border border-red-500 my-4 text-xs font-mono">
            <h3 className="font-bold text-red-600">DEBUG CONSOLE</h3>
            <p>User ID: {user?.id || 'None'}</p>
            <p>Status: {status}</p>
            <button onClick={testInsert} className="bg-red-500 text-white px-2 py-1 mt-2 rounded">
                Test Cart Creation
            </button>
        </div>
    );
}
