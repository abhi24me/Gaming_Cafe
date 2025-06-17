
'use client';

import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext'; // Import AdminAuthProvider
import { LogOut, ShieldCheck, Loader2, UserCircle, LayoutDashboard, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

// This component now consumes the context provided by AdminLayout's AdminAuthProvider
function AdminPagesContent({ children }: { children: React.ReactNode }) {
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
        <header className="py-3 px-2 sm:px-4 md:px-6 bg-card border-b border-border sticky top-0 z-50 shadow-md">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/admin/dashboard" legacyBehavior passHref>
                <a className="flex items-center text-lg sm:text-xl font-bold text-primary tracking-wider hover:opacity-80 transition-opacity">
                  <ShieldCheck className="h-5 w-5 mr-1 sm:h-6 sm:w-6 sm:mr-2" />
                  <span className="sm:hidden">Admin</span>
                  <span className="hidden sm:inline">Wello Admin</span>
                </a>
              </Link>
              <nav className="flex items-center space-x-1 sm:space-x-2">
                <Link href="/admin/dashboard" passHref legacyBehavior>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 h-auto",
                      pathname === '/admin/dashboard' ? "text-primary font-semibold bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:ml-1.5 sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <Link href="/admin/history" passHref legacyBehavior>
                   <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 h-auto",
                      pathname === '/admin/history' ? "text-primary font-semibold bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <History className="h-4 w-4" />
                    <span className="hidden sm:ml-1.5 sm:inline">History</span>
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {adminUser && (
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-foreground">
                  <UserCircle className="h-5 w-5 text-primary"/>
                  <span className="hidden sm:inline">
                    {adminUser.username}
                  </span>
                </div>
              )}
              <Button 
                onClick={adminLogout} 
                variant="outline" 
                size="sm" 
                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive focus:ring-destructive px-2 py-1 sm:px-3 sm:py-1.5 h-auto"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:ml-1 sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className="flex-grow container mx-auto py-6 sm:py-8 px-2 sm:px-4">
        {(isAdminAuthenticated || pathname === '/admin/login') ? children : null}
      </main>
      <footer className="py-4 text-center text-muted-foreground text-xs border-t border-border bg-card/80 mt-auto">
          Wello Admin Portal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// AdminLayout is the default export for this route segment's layout
export default function AdminLayout({ children }: { children: React.ReactNode; }) {
  return (
    <AdminAuthProvider>
      <AdminPagesContent>{children}</AdminPagesContent>
    </AdminAuthProvider>
  );
}
