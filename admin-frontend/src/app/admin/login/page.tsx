
'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const { adminLogin, isLoadingAdminAuth, isAdminAuthenticated } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAdminAuth && isAdminAuthenticated) {
      router.replace('/admin/dashboard');
    }
  }, [isLoadingAdminAuth, isAdminAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim() && passwordInput) {
      await adminLogin(usernameInput.trim(), passwordInput);
    }
  };
  
  if (isLoadingAdminAuth && !isAdminAuthenticated) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Checking admin session...</p>
      </div>
    );
  }

  if (isAdminAuthenticated) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
     );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-border bg-card">
        <CardHeader className="text-center p-6">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary mb-3" />
          <CardTitle className="text-2xl sm:text-3xl font-semibold text-primary-foreground">Admin Access</CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            Enter your admin credentials to proceed.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6 pb-4">
            <div className="space-y-2">
              <Label htmlFor="adminUsername" className="text-foreground font-medium">Admin Username</Label>
              <Input
                id="adminUsername"
                type="text"
                placeholder="e.g., admin_user"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                className="bg-background/70 border-input focus:border-primary focus:ring-primary text-base"
                disabled={isLoadingAdminAuth}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword" className="text-foreground font-medium">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="bg-background/70 border-input focus:border-primary focus:ring-primary text-base"
                disabled={isLoadingAdminAuth}
              />
            </div>
          </CardContent>
          <CardFooter className="px-6 pb-6 pt-2">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 btn-glow-primary" disabled={isLoadingAdminAuth}>
              {isLoadingAdminAuth ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Login to Admin Panel'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
