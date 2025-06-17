
'use client';

import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { LogOut, ShieldCheck, Loader2, Home, UserCircle, LayoutDashboard, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

function AdminPagesLayout({ children }: { children: React.ReactNode }) {
  const { isAdminAuthenticated, isLoadingAdminAuth, adminLogout, adminUser } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAdminAuth && !isAdminAuthenticated && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [isLoadingAdminAuth, isAdminAuthenticated, pathname, router]);

  useEffect(() => {
    if (!isLoadingAdminAuth && isAdminAuthenticated && pathname === '/admin/login') {
      router.replace('/admin/dashboard');
    }
  }, [isLoadingAdminAuth, isAdminAuthenticated, pathname, router]);


  if (isLoadingAdminAuth && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading Admin Session...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-muted/30 text-foreground">
      {isAdminAuthenticated && (
        <header className="py-3 px-4 sm:px-6 md:px-8 bg-card border-b border-border sticky top-0 z-50 shadow-md">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link href="/admin/dashboard" legacyBehavior passHref>
                <a className="flex items-center text-xl sm:text-2xl font-bold text-primary tracking-wider hover:opacity-80 transition-opacity">
                  <ShieldCheck className="h-6 w-6 mr-1 sm:h-7 sm:w-7 sm:mr-2" />
                  Wello Admin
                </a>
              </Link>
              <nav className="flex items-center space-x-2 sm:space-x-3">
                <Link href="/admin/dashboard" passHref legacyBehavior>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-sm",
                      pathname === '/admin/dashboard' ? "text-primary font-semibold bg-primary/10" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <LayoutDashboard className="mr-1.5 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/admin/history" passHref legacyBehavior>
                   <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-sm",
                      pathname === '/admin/history' ? "text-primary font-semibold bg-primary/10" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <History className="mr-1.5 h-4 w-4" />
                    History
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              {adminUser && (
                <div className="flex items-center space-x-2 text-sm text-foreground">
                  <UserCircle className="h-5 w-5 text-primary"/>
                  <span className="hidden sm:inline">
                    {adminUser.username}
                  </span>
                </div>
              )}
              <Button onClick={adminLogout} variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive focus:ring-destructive">
                <LogOut className="mr-1 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className="flex-grow container mx-auto py-6 sm:py-8 px-4">
        {(isAdminAuthenticated || pathname === '/admin/login') ? children : null}
      </main>
      <footer className="py-4 text-center text-muted-foreground text-xs border-t border-border bg-card/80 mt-auto">
          Wello Admin Portal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode; }) {
  return <AdminPagesLayout>{children}</AdminPagesLayout>;
}
    