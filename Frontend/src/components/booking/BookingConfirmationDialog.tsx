
'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Screen, TimeSlot } from '@/lib/types';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  screen: Screen | null;
  slot: TimeSlot | null;
  date: Date | null;
  onConfirm: (gamerTag: string, addSecondConsole: boolean) => Promise<void>;
  isSubmitting?: boolean;
}

export default function BookingConfirmationDialog({
  isOpen,
  onOpenChange,
  screen,
  slot,
  date,
  onConfirm,
  isSubmitting = false,
}: BookingConfirmationDialogProps) {
  const [gamerTagInput, setGamerTagInput] = useState('');
  const [addSecondConsole, setAddSecondConsole] = useState(false);
  const { gamerTag: authGamerTag, isAuthenticated } = useAuth();
  const [displaySlotTime, setDisplaySlotTime] = useState<string>('');
  const { toast } = useToast();
  
  const basePrice = slot?.price || 0;
  const totalPrice = basePrice + (addSecondConsole ? 40 : 0);

  useEffect(() => {
    if (isOpen) {
        if (isAuthenticated && authGamerTag) {
            setGamerTagInput(authGamerTag);
        }
        // Reset second console choice every time dialog opens
        setAddSecondConsole(false); 
    }
  }, [isOpen, isAuthenticated, authGamerTag]);

  useEffect(() => {
    if (slot?.startTimeUTC && slot?.endTimeUTC) {
      try {
        const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        const localStart = new Date(slot.startTimeUTC).toLocaleTimeString([], options);
        const localEnd = new Date(slot.endTimeUTC).toLocaleTimeString([], options);
        setDisplaySlotTime(`${localStart} - ${localEnd}`);
      } catch (e) {
        console.error("Error formatting slot time for dialog:", e);
        setDisplaySlotTime(slot.time); // Fallback to original time string
      }
    } else if (slot) {
      setDisplaySlotTime(slot.time); // Fallback if UTC times are not present
    }
  }, [slot, isOpen]);


  if (!isOpen || !screen || !slot || !date) {
    return null;
  }

  const handleConfirm = async () => {
    if (gamerTagInput.trim()) {
      await onConfirm(gamerTagInput.trim(), addSecondConsole);
    } else {
      toast({
        title: "Gamer Tag Required",
        description: "Please enter your Gamer Tag to book.",
        variant: "destructive",
      });
    }
  };

  const isGamerTagEditable = !isAuthenticated || !authGamerTag;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
        if (isSubmitting) return; // Prevent closing while submitting
        onOpenChange(open);
    }}>
      <AlertDialogContent className="bg-background border-glow-accent p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-accent text-xl sm:text-2xl">Confirm Your Session</AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/80 pt-1 sm:pt-2 text-xs sm:text-sm">
            You are about to book:
          </AlertDialogDescription>
          <ul className="list-disc list-inside my-1 sm:my-2 text-foreground text-xs sm:text-sm space-y-1">
            <li><span className="font-semibold">Screen:</span> {screen.name}</li>
            <li><span className="font-semibold">Date:</span> {date.toLocaleDateString()}</li>
            <li><span className="font-semibold">Time:</span> {displaySlotTime}</li>
            {slot.price !== undefined && <li><span className="font-semibold">Total Price:</span> ₹{totalPrice.toFixed(2)} (deducted from wallet)</li>}
          </ul>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="gamerTagDialog" className="text-foreground/90 text-xs sm:text-sm">
                Gamer Tag
              </Label>
              <Input
                id="gamerTagDialog"
                value={gamerTagInput}
                onChange={(e) => setGamerTagInput(e.target.value)}
                placeholder="e.g., ProPlayer123"
                className="mt-1 bg-card border-primary focus:ring-primary text-base"
                disabled={isSubmitting || !isGamerTagEditable}
                readOnly={!isGamerTagEditable}
              />
            </div>
            
            <div className="flex items-center space-x-2 rounded-lg bg-background/40 p-3 border border-border/70">
                <Checkbox
                    id="addSecondConsole"
                    checked={addSecondConsole}
                    onCheckedChange={(checked) => setAddSecondConsole(checked as boolean)}
                    disabled={isSubmitting}
                />
                <Label htmlFor="addSecondConsole" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    Add a second console for an extra <span className="font-bold text-primary">₹40</span>?
                </Label>
            </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel asChild>
            <Button variant="outline" className="border-muted hover:border-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto" disabled={isSubmitting}>Cancel</Button>
          </AlertDialogCancel>
          <Button onClick={handleConfirm} className="btn-gradient-primary-accent text-primary-foreground btn-glow-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto" disabled={isSubmitting || !gamerTagInput.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
