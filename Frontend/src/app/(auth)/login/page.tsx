
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
// Note: ShadCN components like Card and Button are no longer used here.
// The new styling is handled by custom classes in globals.css.

export default function LoginPage() {
  const [emailInput, setEmailInput] = useState('');
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
    // The new layout does not use the <Card> component.
    // Instead, it uses custom CSS classes for the futuristic look.
    <>
      <form className="login-form-container" onSubmit={handleSubmit}>
        <div className="input-container">
          <div className="input-content">
            <div className="input-dist">
              <div className="input-type">
                <input
                  className="input-is"
                  type="email"
                  required
                  placeholder="Email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isLoading}
                />
                <input
                  className="input-is"
                  type="password"
                  required
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isLoading}
                />
                <button className="submit" type="submit" disabled={isLoading}>
                  {isLoading ? 'Logging In...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">
        <Link href="/forgot-password" legacyBehavior passHref>
          <a className="font-semibold text-primary hover:underline">
            Forgot Password?
          </a>
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" legacyBehavior passHref>
          <a className="font-semibold text-primary hover:underline">
            Sign up here
          </a>
        </Link>
      </p>
    </>
  );
}
