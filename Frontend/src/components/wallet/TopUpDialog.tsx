
'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { IndianRupee, WalletCards, CreditCard, Smartphone, Landmark } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast"; // Import useToast for error handling

interface TopUpDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const SUGGESTED_AMOUNTS = [200, 500, 1000];
const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI', icon: Smartphone },
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'netbanking', name: 'Net Banking', icon: Landmark },
];

export default function TopUpDialog({ isOpen, onOpenChange }: TopUpDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const { requestTopUp, balance } = useWallet(); // Changed from topUp to requestTopUp
  const { toast } = useToast();

  // Reset amount when dialog opens or closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      // Optionally reset payment method too, or keep it sticky
      // setSelectedPaymentMethod(PAYMENT_METHODS[0].id);
    }
  }, [isOpen]);

  const handleTopUpRequest = async () => {
    const topUpAmount = parseFloat(amount);
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive"
      });
      return;
    }
    if (!selectedPaymentMethod) {
        toast({
          title: "Payment Method Required",
          description: "Please select a payment method.",
          variant: "destructive"
        });
        return;
      }

    setIsLoading(true);
    // Simulate a transaction ID for the payment method, in a real scenario this would come from a payment gateway
    const mockTransactionId = `mock_txn_${Date.now()}`;
    await requestTopUp(topUpAmount, selectedPaymentMethod, mockTransactionId);
    setIsLoading(false);
    
    // requestTopUp already shows a toast on success/failure
    // Only close dialog if request was initiated (even if it later fails on backend, toast from context handles that)
    onOpenChange(false); 
    // setAmount(''); // Reset happens in useEffect onOpenChange
  };

  const handleSuggestionClick = (suggestedAmount: number) => {
    setAmount(suggestedAmount.toString());
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border-glow-accent p-4 sm:p-6">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2 mb-1 sm:mb-2">
            <WalletCards className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
            <AlertDialogTitle className="text-accent text-xl sm:text-2xl">Request Wallet Top-Up</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-foreground/80 pt-1 sm:pt-2 text-xs sm:text-sm">
            Current Balance: <span className="font-semibold text-primary">₹{balance.toFixed(2)}</span>
          </AlertDialogDescription>
          <AlertDialogDescription className="text-foreground/80 text-xs sm:text-sm">
            Enter the amount and select a payment method. Your request will be reviewed by an admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2 sm:py-4 space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="topUpAmount" className="text-foreground/90 text-xs sm:text-sm">
              Top-Up Amount (₹)
            </Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input
                id="topUpAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 500"
                className="bg-card border-primary focus:ring-primary pl-8 sm:pl-10 text-base"
                min="1"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Add:</Label>
            <div className="flex gap-2">
              {SUGGESTED_AMOUNTS.map((suggested) => (
                <Button
                  key={suggested}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggested)}
                  className="border-primary/50 hover:bg-primary/10 hover:border-primary text-primary flex-1 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 h-auto"
                  disabled={isLoading}
                >
                  ₹{suggested}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm text-muted-foreground">Select Payment Method</Label>
            <RadioGroup 
              value={selectedPaymentMethod} 
              onValueChange={setSelectedPaymentMethod}
              className="space-y-2"
            >
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <Label 
                    key={method.id} 
                    htmlFor={`payment-${method.id}`} 
                    className={`flex items-center space-x-2 p-2 sm:p-3 bg-card/50 border border-border/70 rounded-md hover:border-primary/70 has-[input:checked]:border-primary has-[input:checked]:bg-primary/10 transition-all ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <RadioGroupItem 
                        value={method.id} 
                        id={`payment-${method.id}`} 
                        className="border-primary text-primary focus:ring-primary" 
                        disabled={isLoading}
                    />
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="text-xs sm:text-sm text-foreground/90">{method.name}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        </div>
        <AlertDialogFooter className="gap-2 sm:gap-0 pt-2 sm:pt-4">
          <AlertDialogCancel asChild>
            <Button variant="outline" className="border-muted hover:border-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto" disabled={isLoading}>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleTopUpRequest} className="btn-gradient-primary-accent text-primary-foreground btn-glow-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
