
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

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  screen: Screen | null;
  slot: TimeSlot | null;
  date: Date | null;
  onConfirm: (gamerTag: string) => Promise<void>;
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
  const { gamerTag: authGamerTag, isAuthenticated } = useAuth();
  const [displaySlotTime, setDisplaySlotTime] = useState<string>('');

  useEffect(() => {
    if (isOpen && isAuthenticated && authGamerTag) {
      setGamerTagInput(authGamerTag);
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
      await onConfirm(gamerTagInput.trim());
    } else {
      alert("Please enter your Gamer Tag."); // Simple validation, consider toast
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
            {slot.price !== undefined && <li><span className="font-semibold">Price:</span> ₹{slot.price} (deducted from wallet)</li>}
          </ul>
          <div className="flex items-start text-left text-xs text-muted-foreground p-3 mt-2 bg-background/30 rounded-lg border border-dashed border-border/50">
            <Info className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-primary/80" />
            <div>
                <p className="font-semibold text-foreground/90">Note on Additional Consoles:</p>
                <p>The price shown is for a single console. An extra ₹50 per hour will be charged at the venue for using a second console on the same screen.</p>
            </div>
          </div>
          <AlertDialogDescription className="text-foreground/80 text-xs sm:text-sm pt-2">
            {isGamerTagEditable ? "Please confirm your Gamer Tag to proceed." : "Your Gamer Tag is confirmed."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2 sm:py-4">
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
