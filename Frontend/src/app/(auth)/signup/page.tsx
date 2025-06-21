
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const [gamerTagInput, setGamerTagInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState(''); // Will store only 10 digits
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [gamerTagError, setGamerTagError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { signup } = useAuth();

  const validateForm = (): boolean => {
    let isValid = true;
    setGamerTagError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');

    if (!gamerTagInput.trim()) {
      setGamerTagError('Gamer Tag is required.');
      isValid = false;
    } else if (gamerTagInput.trim().length < 3) {
      setGamerTagError('Gamer Tag must be at least 3 characters.');
      isValid = false;
    } else if (gamerTagInput.trim().length > 20) {
      setGamerTagError('Gamer Tag must be at most 20 characters.');
      isValid = false;
    }

    if (!emailInput.trim()) {
      setEmailError('Email is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }
    
    // Validate phone number: optional, but if provided, must be 10 digits
    if (phoneInput.trim()) {
      if (!/^\d{10}$/.test(phoneInput.trim())) {
        setPhoneError('Phone number must be 10 digits.');
        isValid = false;
      }
    }

    if (!passwordInput) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (passwordInput.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      const formattedPhone = phoneInput.trim() ? `+91${phoneInput.trim()}` : undefined;
      await signup(gamerTagInput.trim(), emailInput.trim(), passwordInput, formattedPhone);
      setIsLoading(false);
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setPhoneInput(value.slice(0, 10)); // Limit to 10 digits
    if (phoneError) validateForm(); // Re-validate if there was an error
  };

  return (
    <>
      <form className="login-form-container" onSubmit={handleSubmit}>
        <div className="input-container">
          <div className="input-content">
            <div className="input-dist">
              <div className="input-type">
                <div className="w-full">
                  <input
                    className="input-is"
                    type="text"
                    required
                    placeholder="Gamer Tag"
                    value={gamerTagInput}
                    onChange={(e) => {
                      setGamerTagInput(e.target.value);
                      if (gamerTagError) validateForm();
                    }}
                    disabled={isLoading}
                    aria-invalid={!!gamerTagError}
                  />
                  {gamerTagError && <p className="text-xs text-destructive text-left mt-1 px-1">{gamerTagError}</p>}
                </div>

                <div className="w-full">
                  <input
                    className="input-is"
                    type="email"
                    required
                    placeholder="Email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (emailError) validateForm();
                    }}
                    disabled={isLoading}
                    aria-invalid={!!emailError}
                  />
                  {emailError && <p className="text-xs text-destructive text-left mt-1 px-1">{emailError}</p>}
                </div>
                
                <div className="w-full">
                  <input
                    className="input-is"
                    type="tel"
                    placeholder="Phone (Optional, 10 digits)"
                    value={phoneInput}
                    onChange={handlePhoneInputChange}
                    disabled={isLoading}
                    maxLength={10}
                    aria-invalid={!!phoneError}
                  />
                  {phoneError && <p className="text-xs text-destructive text-left mt-1 px-1">{phoneError}</p>}
                </div>

                <div className="w-full">
                  <input
                    className="input-is"
                    type="password"
                    required
                    placeholder="Password (min 8 chars)"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) validateForm();
                    }}
                    disabled={isLoading}
                    aria-invalid={!!passwordError}
                  />
                  {passwordError && <p className="text-xs text-destructive text-left mt-1 px-1">{passwordError}</p>}
                </div>
                
                <button className="submit" type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/login" legacyBehavior passHref>
          <a className="font-semibold text-primary hover:underline">
            Login here
          </a>
        </Link>
      </p>
    </>
  );
}
