'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/user.store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkSession = useUserStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return <>{children}</>;
}
