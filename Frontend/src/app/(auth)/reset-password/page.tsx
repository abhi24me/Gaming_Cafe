
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      setError('Invalid or missing password reset token. Please request a new link.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Reset token is missing. The link may be invalid or expired.');
      return;
    }
    
    setIsLoading(true);

    const success = await resetPassword(token, password);
    
    if (success) {
      setMessage('Your password has been reset successfully! You will be redirected to the login page shortly.');
      setTimeout(() => router.push('/login'), 4000);
    } else {
      // The error message is set by the context via toast, but we can set a local one too.
      setError('Failed to reset password. The link may have expired or is invalid.');
    }

    setIsLoading(false);
  };

  if (!token && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Verifying link...</p>
      </div>
    );
  }

  return (
    <>
      <form className="login-form-container" onSubmit={handleSubmit}>
        <div className="input-container">
          <div className="input-content">
            <div className="input-dist">
              <h2 className="text-2xl font-bold text-primary mb-4 text-center" style={{ fontFamily: 'var(--font-heading)', fontStyle: 'normal' }}>
                Reset Your Password
              </h2>
              <div className="input-type">
                <input
                  className="input-is"
                  type="password"
                  required
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || !!message}
                />
                <input
                  className="input-is"
                  type="password"
                  required
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading || !!message}
                />
                <button className="submit" type="submit" disabled={isLoading || !token || !!message}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      {error && <p className="text-center text-sm text-destructive mt-6">{error}</p>}
      {message && <p className="text-center text-sm text-green-400 mt-6">{message}</p>}
      {!message && (
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/login" legacyBehavior passHref>
            <a className="font-semibold text-primary hover:underline">
              Back to Login
            </a>
          </Link>
        </p>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    }>
      <ResetPasswordComponent />
    </Suspense>
  );
}
