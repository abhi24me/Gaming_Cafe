
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
import { IndianRupee, WalletCards, UploadCloud, XCircle, Loader2, Sparkles, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TopUpDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const SUGGESTED_AMOUNTS = [200, 500, 1000];

export default function TopUpDialog({ isOpen, onOpenChange }: TopUpDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [bonusInfo, setBonusInfo] = useState<{ bonusAmount: number; bonusPercent: number } | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'amount' | 'upload'>('amount');
  const [isLoading, setIsLoading] = useState(false);
  const { requestTopUp, balance } = useWallet();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Calculate bonus when amount changes
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
        let percent = 0;
        if (numericAmount >= 1000) {
            percent = 12;
        } else if (numericAmount >= 500) {
            percent = 8;
        } else if (numericAmount >= 200) {
            percent = 5;
        }

        if (percent > 0) {
            const bonus = (numericAmount * percent) / 100;
            setBonusInfo({ bonusAmount: bonus, bonusPercent: percent });
        } else {
            setBonusInfo(null);
        }
    } else {
        setBonusInfo(null);
    }
  }, [amount]);


  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setCurrentStep('amount');
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File Too Large", description: "Receipt image must be under 5MB.", variant: "destructive" });
        setReceiptFile(null);
        setReceiptPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a JPG, PNG, or WEBP image.", variant: "destructive" });
        setReceiptFile(null);
        setReceiptPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProceedToPayment = () => {
    const topUpAmount = parseFloat(amount);
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    setCurrentStep('upload');
  };

  const handleSubmitRequest = async () => {
    const topUpAmount = parseFloat(amount);
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please ensure the amount is valid.", variant: "destructive" });
      return;
    }
    if (!receiptFile) {
      toast({ title: "Receipt Required", description: "Please upload your payment receipt.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await requestTopUp(topUpAmount, receiptFile); // UPI Transaction ID removed
      onOpenChange(false);
    } catch (error) {
      // Error handling is inside requestTopUp, but catch here if it re-throws or for local state
      console.error("Error in handleSubmitRequest after requestTopUp:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestedAmount: number) => {
    setAmount(suggestedAmount.toString());
  };
  
  const handleDownloadQr = async () => {
    try {
      const imageUrl = '/images/upi-qr-code.png';
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'wello-upi-qr-code.png');
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('QR Code download failed:', error);
      toast({
        title: "Download Failed",
        description: "The QR code image file may be missing or could not be loaded. Please try taking a screenshot.",
        variant: "destructive",
      });
    }
  };


  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
        if (isLoading) return;
        onOpenChange(open);
    }}>
      <AlertDialogContent className="bg-background border-glow-accent p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2 mb-1 sm:mb-2">
            <WalletCards className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
            <AlertDialogTitle className="text-accent text-xl sm:text-2xl">Request Wallet Top-Up (UPI)</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-foreground/80 pt-1 sm:pt-2 text-xs sm:text-sm">
            Current Balance: <span className="font-semibold text-primary">₹{balance.toFixed(2)}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {currentStep === 'amount' && (
          <>
            <div className="py-2 sm:py-4 space-y-3 sm:space-y-4">
              <div className="text-xs text-muted-foreground p-2.5 bg-background/50 rounded-md border border-dashed border-primary/30">
                <p className="font-semibold text-primary flex items-center"><Sparkles className="h-4 w-4 mr-1.5"/> Bonus Offers:</p>
                <ul className="list-disc list-inside pl-2 mt-1 space-y-0.5">
                  <li><span className="font-bold">5% Bonus</span> on top-ups from ₹200 to ₹499.</li>
                  <li><span className="font-bold">8% Bonus</span> on top-ups from ₹500 to ₹999.</li>
                  <li><span className="font-bold">12% Bonus</span> on top-ups of ₹1000 or more.</li>
                </ul>
              </div>
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
                  />
                </div>
              </div>
              {bonusInfo && (
                <div className="text-center text-sm text-green-400 bg-green-500/10 p-2 rounded-md transition-all animate-in fade-in-50">
                  You get a <span className="font-bold">{bonusInfo.bonusPercent}%</span> bonus!
                  <br />
                  Bonus Amount: <span className="font-bold">₹{bonusInfo.bonusAmount.toFixed(2)}</span>. Total Credit: <span className="font-bold">₹{(parseFloat(amount) + bonusInfo.bonusAmount).toFixed(2)}</span>
                </div>
              )}
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
                    >
                      ₹{suggested}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <AlertDialogFooter className="gap-2 sm:gap-0 pt-2 sm:pt-4">
              <AlertDialogCancel asChild>
                <Button variant="outline" className="border-muted hover:border-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto">Cancel</Button>
              </AlertDialogCancel>
              <Button onClick={handleProceedToPayment} className="btn-gradient-primary-accent text-primary-foreground btn-glow-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto" disabled={!amount || parseFloat(amount) <= 0}>
                Proceed to payment
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {currentStep === 'upload' && (
          <>
            <div className="py-2 sm:py-4 space-y-3 sm:space-y-4">
              <AlertDialogDescription className="text-foreground/80 text-xs sm:text-sm">
                Scan the QR code with your UPI app to pay <span className="font-semibold text-primary">₹{amount}</span>.
                Then, upload the payment receipt (screenshot).
              </AlertDialogDescription>
              
              <div className="flex justify-center my-3 sm:my-4 flex-col items-center gap-2">
                <Image 
                  src="/images/upi-qr-code.png" 
                  alt="UPI QR Code" 
                  width={180} 
                  height={180}
                  className="rounded-md border-2 border-primary shadow-lg"
                  data-ai-hint="QR code"
                  priority 
                />
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadQr} className="text-xs">
                  <Download className="mr-2 h-3.5 w-3.5"/>
                  Download QR
                </Button>
              </div>

              <div>
                <Label htmlFor="receiptUpload" className="text-foreground/90 text-xs sm:text-sm">
                  Upload Payment Receipt (JPG, PNG, WEBP, max 5MB)
                </Label>
                <div className="mt-1 flex items-center justify-center w-full">
                    <label htmlFor="receiptUpload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-primary border-dashed rounded-lg cursor-pointer bg-card hover:bg-card/90 transition-colors">
                        {receiptPreview ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image src={receiptPreview} alt="Receipt preview" layout="fill" objectFit="contain" className="p-1 rounded" data-ai-hint="payment receipt"/>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-primary" />
                                <p className="mb-1 text-xs sm:text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">Image file (MAX. 5MB)</p>
                            </div>
                        )}
                        <Input id="receiptUpload" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" ref={fileInputRef} />
                    </label>
                </div>
              </div>

              {receiptPreview && (
                 <div className="mt-2 text-center">
                    <Button variant="ghost" size="sm" onClick={clearReceipt} className="text-destructive hover:bg-destructive/10 text-xs">
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Clear Receipt
                    </Button>
                </div>
              )}
            </div>
            <AlertDialogFooter className="gap-2 sm:gap-0 pt-2 sm:pt-4">
              <Button variant="outline" onClick={() => setCurrentStep('amount')} className="border-muted hover:border-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto" disabled={isLoading}>Back</Button>
              <Button onClick={handleSubmitRequest} className="btn-gradient-primary-accent text-primary-foreground btn-glow-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto" disabled={isLoading || !receiptFile}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
