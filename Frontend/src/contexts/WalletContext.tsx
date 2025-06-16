
'use client';

import type { WalletState, Transaction, WalletData } from '@/lib/types'; 
import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import apiClient, { ApiError } from '@/lib/apiClient';
import { useAuth } from './AuthContext';

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      return;
    }
    setIsLoading(true);
    try {
      // Ensure backend has /api/wallet/details endpoint
      const [walletDetails, userTransactions] = await Promise.all([
        apiClient<WalletData>('/wallet/details'), 
        apiClient<Transaction[]>('/wallet/transactions'),
      ]);

      setBalance(walletDetails.balance);
      setLoyaltyPoints(walletDetails.loyaltyPoints);
      setTransactions(userTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Could not load wallet information.";
      if (isAuthenticated) { // Only show toast if user is logged in and expected data
          toast({
            title: "Wallet Error",
            description: errorMessage,
            variant: "destructive",
          });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userToken, toast]);

  useEffect(() => {
    if (!isLoadingAuth) { 
        fetchWalletData();
    }
  }, [fetchWalletData, isLoadingAuth]);

  // Updated requestTopUp to handle FormData with receipt
  const requestTopUp = async (amount: number, receiptFile: File) => {
    if (amount <= 0) {
      toast({ title: "Invalid Amount", description: "Top-up amount must be positive.", variant: "destructive" });
      return;
    }
    if (!receiptFile) {
      toast({ title: "Receipt Missing", description: "Payment receipt is required.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('amount', amount.toString());
    formData.append('paymentMethod', 'UPI'); // Implicitly UPI for this flow
    formData.append('receipt', receiptFile);
    // transactionId is not sent from frontend, backend can generate or payment gateway would provide

    try {
      // apiClient will handle FormData by not setting Content-Type: application/json
      await apiClient<any>('/wallet/request-topup', { // Backend endpoint for top-up request
        method: 'POST',
        body: formData, // Sending FormData
      });
      toast({
        title: "Top-Up Request Submitted",
        description: `Your request to add ₹${amount.toFixed(2)} with receipt is pending approval.`,
        className: "bg-primary text-primary-foreground border-primary",
      });
      // Balance updates after admin approval and re-fetch.
      // Optionally, you could refetch transactions here if pending requests are shown in user's transaction list
      // await fetchWalletData(); 
    } catch (error) {
      console.error("Top-up request API error:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to submit top-up request.";
      toast({ title: "Top-Up Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const value: WalletState = { 
    balance, 
    transactions, 
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
