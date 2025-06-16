
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { isAdminAuthenticated, isLoadingAdminAuth } = useAdminAuth();

  useEffect(() => {
    if (!isLoadingAdminAuth) {
      if (isAdminAuthenticated) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/admin/login');
      }
    }
  }, [isAdminAuthenticated, isLoadingAdminAuth, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">Loading Admin Portal...</p>
    </div>
  );
}
