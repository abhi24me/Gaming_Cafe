
'use client';

import type { AuthState } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import apiClient, { ApiError } from '@/lib/apiClient';

const AuthContext = createContext<AuthState | undefined>(undefined);

const GAMER_TAG_KEY = 'welloGamerTag';
const USER_TOKEN_KEY = 'welloUserToken'; // Changed from isAuthenticated to store the actual token

interface LoginResponse {
  token: string;
  user: {
    id: string;
    gamerTag: string;
    email: string;
  };
}

interface SignupResponse {
  token: string;
  user: {
    id: string;
    gamerTag: string;
    email: string;
  };
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [gamerTag, setGamerTag] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(USER_TOKEN_KEY);
      const storedGamerTag = localStorage.getItem(GAMER_TAG_KEY); // Keep for display consistency if token doesn't directly provide it

      if (storedToken) {
        setUserToken(storedToken);
        setGamerTag(storedGamerTag); // Or parse from token if available
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  const storeSession = (token: string, currentGamerTag: string) => {
    try {
      localStorage.setItem(USER_TOKEN_KEY, token);
      localStorage.setItem(GAMER_TAG_KEY, currentGamerTag);
      setUserToken(token);
      setGamerTag(currentGamerTag);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to save session to localStorage:", error);
      toast({ title: "Session Error", description: "Could not save session.", variant: "destructive" });
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem(GAMER_TAG_KEY);
      setUserToken(null);
      setGamerTag(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Failed to clear session from localStorage:", error);
    }
  };

  const login = async (emailOrGamerTag: string, password?: string) => {
    // Backend login uses email and password. Signup sets gamerTag for mock.
    // This function will now primarily be for actual login.
    // The previous `login(tag: string)` was for mock.
    if (!password) { // This condition is for the mock scenario, should be removed if only email/password login is used.
        // This path is likely from the old mock signup flow if `password` is undefined.
        // For actual API integration, signup will handle its own API call.
        // Let's assume this is the API login path now.
         toast({ title: "Login Error", description: "Password is required for login.", variant: "destructive" });
        return;
    }

    try {
      const response = await apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailOrGamerTag, password }),
      });
      storeSession(response.token, response.user.gamerTag);
      router.push('/');
      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.user.gamerTag}!`,
        className: "bg-green-600 text-white border-green-700",
      });
    } catch (error) {
      console.error("Login API error:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Login failed. Please check your credentials.";
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    }
  };
  
  const signup = async (gamerTagInput: string, emailInput: string, passwordInput: string, phoneInput?: string) => {
    try {
      const payload: any = { 
        gamerTag: gamerTagInput, 
        email: emailInput, 
        password: passwordInput 
      };
      if (phoneInput) payload.phoneNumber = phoneInput;

      const response = await apiClient<SignupResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      storeSession(response.token, response.user.gamerTag);
      router.push('/');
      toast({
        title: "Signup Successful!",
        description: `Welcome to Wello, ${response.user.gamerTag}! Your adventure begins.`,
        className: "bg-green-600 text-white border-green-700",
      });
    } catch (error) {
      console.error("Signup API error:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Signup failed. Please try again.";
      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
    }
  };


  const logout = () => {
    const currentTag = gamerTag;
    clearSession();
    // Redirect to login only if not already on an auth page or public page
    if (!pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
        router.push('/login');
    }
    toast({
        title: "Logged Out",
        description: `See you soon, ${currentTag || 'Gamer'}!`,
    });
  };

  // Update Gamer Tag is kept client-side for now as per current setup
  // To integrate with backend, this would need an API call
  const updateGamerTag = (newTag: string) => {
    if (newTag.trim() && isAuthenticated) {
      const oldTag = gamerTag;
      const trimmedNewTag = newTag.trim();
      setGamerTag(trimmedNewTag); // Optimistic update
      try {
        localStorage.setItem(GAMER_TAG_KEY, trimmedNewTag); // Update local storage
      } catch (error) {
        console.error("Failed to update gamerTag in localStorage:", error);
      }
      toast({
        title: "Gamer Tag Updated!",
        description: `Your Gamer Tag has been changed from ${oldTag} to ${trimmedNewTag}. (Client-side update)`,
        className: "bg-primary text-primary-foreground border-primary",
      });
      // TODO: Add API call here to persist to backend if endpoint exists
      // e.g., apiClient('/auth/profile', { method: 'PUT', body: JSON.stringify({ gamerTag: trimmedNewTag }) });
    } else if (!newTag.trim()) {
        toast({
            title: "Invalid Gamer Tag",
            description: "Gamer Tag cannot be empty.",
            variant: "destructive",
        });
    }
  };

  const value = { gamerTag, isAuthenticated, login, logout, updateGamerTag, signup, userToken, isLoadingAuth: isLoading };

  if (isLoading) {
    return null; 
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { // No type assertion needed for return if AuthState is defined correctly
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
