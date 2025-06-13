
'use client';

import type { WalletState, Transaction, Booking, WalletData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import apiClient, { ApiError } from '@/lib/apiClient';
import { useAuth } from './AuthContext';

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Bookings are now fetched by BookingsPage or after a booking is made.
  // const [bookings, setBookings] = useState<Booking[]>([]); 
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { toast } = useToast();
  const { isAuthenticated, userToken, isLoadingAuth } = useAuth();

  const fetchWalletData = useCallback(async () => {
    if (!isAuthenticated || !userToken) {
      setIsLoading(false);
      setBalance(0);
      setTransactions([]);
      setLoyaltyPoints(0);
      // setBookings([]);
      return;
    }
    setIsLoading(true);
    try {
      // Parallel fetching for wallet details and transactions
      // Bookings will be fetched by their respective pages or after actions
      const [walletDetails, userTransactions] = await Promise.all([
        apiClient<WalletData>('/wallet/details'), 
        apiClient<Transaction[]>('/wallet/transactions'),
      ]);

      setBalance(walletDetails.balance);
      setLoyaltyPoints(walletDetails.loyaltyPoints);
      // Sort transactions by date, most recent first
      setTransactions(userTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      // setBookings(userBookings.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()));

    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Could not load wallet information.";
      toast({
        title: "Wallet Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userToken, toast]);

  useEffect(() => {
    if (!isLoadingAuth) { 
        fetchWalletData();
    }
  }, [fetchWalletData, isLoadingAuth]);

  const requestTopUp = async (amount: number, paymentMethod: string, transactionId?: string) => {
    if (amount <= 0) {
      toast({ title: "Invalid Amount", description: "Top-up amount must be positive.", variant: "destructive" });
      return;
    }
    try {
      const payload: any = { amount, paymentMethod };
      if (transactionId) payload.transactionId = transactionId;

      await apiClient<any>('/wallet/request-topup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast({
        title: "Top-Up Request Submitted",
        description: `Your request to add ₹${amount.toFixed(2)} is pending approval.`,
        className: "bg-primary text-primary-foreground border-primary",
      });
      // Balance updates after admin approval and re-fetch.
    } catch (error) {
      console.error("Top-up request API error:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to submit top-up request.";
      toast({ title: "Top-Up Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const value: WalletState = { 
    balance, 
    transactions, 
    // bookings, // Removed as bookings are handled page-specifically or re-fetched
    loyaltyPoints, 
    isLoading,
    fetchWalletData,
    requestTopUp,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
