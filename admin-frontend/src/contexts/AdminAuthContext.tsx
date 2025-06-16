
'use client';

import type { AdminAuthState, AdminUserDetails, AdminLoginResponse } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import apiClient, { ApiError } from '@/lib/apiClient';

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

const ADMIN_TOKEN_KEY = 'welloAdminToken';
const ADMIN_USER_KEY = 'welloAdminUser';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUserDetails | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isLoadingAdminAuth, setIsLoadingAdminAuth] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      const storedAdminUserString = localStorage.getItem(ADMIN_USER_KEY);
      
      if (storedToken && storedAdminUserString) {
        setAdminToken(storedToken);
        setAdminUser(JSON.parse(storedAdminUserString));
        setIsAdminAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to access localStorage for admin session:", error);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    }
    setIsLoadingAdminAuth(false);
  }, []);

  const storeAdminSession = (token: string, adminDetails: AdminUserDetails) => {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminDetails));
      setAdminToken(token);
      setAdminUser(adminDetails);
      setIsAdminAuthenticated(true);
    } catch (error) {
      console.error("Failed to save admin session to localStorage:", error);
      toast({ title: "Admin Session Error", description: "Could not save admin session.", variant: "destructive" });
    }
  };

  const clearAdminSession = useCallback(() => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    } catch (error) {
      console.error("Failed to clear admin session from localStorage:", error);
    }
    setAdminToken(null);
    setAdminUser(null);
    setIsAdminAuthenticated(false);
  }, []);

  const adminLogin = async (username: string, password?: string) => {
    if (!password) {
      toast({ title: "Login Error", description: "Password is required for admin login.", variant: "destructive" });
      return;
    }

    setIsLoadingAdminAuth(true);
    try {
      const response = await apiClient<AdminLoginResponse>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      storeAdminSession(response.token, response.admin);
      router.push('/admin/dashboard'); // Redirect to admin dashboard
      toast({
        title: "Admin Login Successful",
        description: `Welcome, Admin ${response.admin.username}!`,
        className: "bg-green-600 text-white border-green-700", // Adjust colors as per admin theme
      });
    } catch (error) {
      console.error("Admin Login API error:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Admin login failed. Please check credentials.";
      toast({ title: "Admin Login Failed", description: errorMessage, variant: "destructive" });
      clearAdminSession();
    } finally {
      setIsLoadingAdminAuth(false);
    }
  };
  
  const adminLogout = useCallback(() => {
    const currentAdmin = adminUser?.username;
    clearAdminSession();
    router.push('/admin/login');
    toast({
        title: "Admin Logged Out",
        description: `Goodbye, Admin ${currentAdmin || ''}!`,
    });
  }, [adminUser, clearAdminSession, router, toast]);

  const value: AdminAuthState = { 
    adminUser, 
    adminToken, 
    isAdminAuthenticated, 
    isLoadingAdminAuth, 
    adminLogin, 
    adminLogout 
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
