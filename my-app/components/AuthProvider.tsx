'use client';

import { useEffect, useRef } from 'react';
import { useUserStore } from '@/store/user.store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkSession = useUserStore((state) => state.checkSession);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    checkSession();
  }, [checkSession]);

  return <>{children}</>;
}
