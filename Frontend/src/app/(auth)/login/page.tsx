
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [emailInput, setEmailInput] = useState(''); // Changed from gamerTagInput
  const [passwordInput, setPasswordInput] = useState('');
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim() && passwordInput) {
      setIsLoading(true);
      await login(emailInput.trim(), passwordInput);
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-glow-primary w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl text-primary flex items-center justify-center">
          <LogIn className="mr-2 h-6 w-6 sm:h-7 sm:w-7" /> Enter Wello
        </CardTitle>
        <CardDescription className="text-foreground/80 pt-1">
          Enter your Email and Password to continue.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailLogin" className="text-foreground/90">Email</Label>
            <Input
              id="emailLogin"
              type="email" // Changed from text
              placeholder="e.g., player@wello.com" // Changed placeholder
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              className="bg-background border-primary focus:ring-primary text-base"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordLogin" className="text-foreground/90">Password</Label>
            <Input
              id="passwordLogin"
              type="password"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              className="bg-background border-primary focus:ring-primary text-base"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3">
          <Button type="submit" className="w-full btn-gradient-primary-accent btn-glow-primary text-lg py-3" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Login'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" legacyBehavior passHref>
              <a className="font-semibold text-primary hover:underline">
                Sign up here
              </a>
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
