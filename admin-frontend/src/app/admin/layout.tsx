
'use client';

import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { LogOut, ShieldCheck, Loader2, UserCircle, LayoutDashboard, History, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode; }) {
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
  
  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/history', label: 'History', icon: History },
    { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30 text-foreground">
      {isAdminAuthenticated && (
        <header className="py-3 px-4 md:px-6 bg-card border-b border-border sticky top-0 z-50 shadow-md">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/admin/dashboard" legacyBehavior passHref>
                <a className="flex items-center text-xl font-bold text-primary tracking-wider hover:opacity-80 transition-opacity">
                  <ShieldCheck className="h-6 w-6 mr-2" />
                  Wello Admin
                </a>
              </Link>
              <nav className="flex items-center space-x-1 md:space-x-2">
                {navItems.map((item) => {
                  const isActive = item.href === '/admin/dashboard'
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  
                  return (
                    <Link href={item.href} key={item.href} passHref legacyBehavior>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "text-sm",
                          isActive
                            ? "text-primary font-semibold bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        )}
                      >
                        <item.icon className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              {adminUser && (
                <div className="flex items-center space-x-1 text-sm text-foreground">
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
                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive focus:ring-destructive"
              >
                <LogOut className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className="flex-grow container mx-auto py-6 md:py-8">
        {(isAdminAuthenticated || pathname === '/admin/login') ? children : null}
      </main>
      <footer className="py-4 text-center text-muted-foreground text-xs border-t border-border bg-card/80 mt-auto">
          Wello Admin Portal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
