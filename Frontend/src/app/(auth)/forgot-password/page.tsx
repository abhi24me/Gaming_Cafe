
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setIsLoading(true);
      setMessage('');
      // This function will call the API and handle toasts internally
      await requestPasswordReset(emailInput.trim());
      // We show a generic message to prevent exposing which emails are registered
      setMessage('If an account with that email exists, a password reset link has been sent.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <form className="login-form-container" onSubmit={handleSubmit}>
        <div className="input-container">
          <div className="input-content">
            <div className="input-dist">
                <h2 className="text-2xl font-bold text-primary mb-2 text-center" style={{ fontFamily: 'var(--font-heading)', fontStyle: 'normal' }}>
                    Forgot Password
                </h2>
                <p className="text-center text-sm text-muted-foreground mb-4 px-4" style={{ fontStyle: 'normal' }}>
                    No worries! Enter your email and we&apos;ll send you a reset link.
                </p>
              <div className="input-type">
                <input
                  className="input-is"
                  type="email"
                  required
                  placeholder="Your Email Address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isLoading || !!message}
                />
                <button className="submit" type="submit" disabled={isLoading || !!message}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      {message && <p className="text-center text-sm text-green-400 mt-6">{message}</p>}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Remembered your password?{' '}
        <Link href="/login" legacyBehavior passHref>
          <a className="font-semibold text-primary hover:underline">
            Login
          </a>
        </Link>
      </p>
    </>
  );
}
