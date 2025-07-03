
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
      if (isAuthenticated) { 
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
    formData.append('paymentMethod', 'UPI'); 
    formData.append('receipt', receiptFile);

    try {
      await apiClient<any>('/wallet/request-topup', {
        method: 'POST',
        body: formData,
      });
      toast({
        title: "Top-Up Request Submitted",
        description: `Your request to add ₹${amount.toFixed(2)} is pending approval.`,
        className: "bg-primary text-primary-foreground border-primary",
      });
      await fetchWalletData();
    } catch (error) {
      console.error("Top-up request API error:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to submit top-up request.";
      toast({ title: "Top-Up Failed", description: errorMessage, variant: "destructive" });
      throw error;
    }
  };

  const redeemLoyaltyPoints = async () => {
    try {
      const response = await apiClient<{ message: string; redeemedAmount: number }>('/wallet/redeem-points', {
        method: 'POST',
      });
      toast({
        title: "Points Redeemed!",
        description: `₹${response.redeemedAmount.toFixed(2)} has been added to your wallet.`,
        className: "bg-green-600 text-white border-green-700",
      });
      await fetchWalletData(); // Refresh wallet data
    } catch (error) {
      console.error("Redeem points API error:", error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to redeem points.";
      toast({ title: "Redemption Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const value: WalletState = { 
    balance, 
    transactions, 
    loyaltyPoints, 
    isLoading,
    fetchWalletData,
    requestTopUp,
    redeemLoyaltyPoints,
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
