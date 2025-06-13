
'use client';

import type { Screen, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import TimeSlotButton from './TimeSlotButton';
import React from 'react'; // Removed useState, useEffect, getAvailableSlotsForDate
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface TimeSlotSelectorProps {
  screen: Screen;
  date: Date;
  availableSlots: TimeSlot[]; // Now expects slots to be passed as a prop
  selectedSlotId: string | null;
  onSlotSelect: (slot: TimeSlot) => void;
  onBack: () => void;
  isLoading: boolean; // Added isLoading prop
}

export default function TimeSlotSelector({
  screen,
  date,
  availableSlots,
  selectedSlotId,
  onSlotSelect,
  onBack,
  isLoading
}: TimeSlotSelectorProps) {

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-glow-primary w-full max-w-md mx-auto">
      <CardHeader className="relative text-center p-4 sm:p-6">
         <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-2 top-2 sm:left-3 sm:top-3 text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
           <span className="sr-only">Back to Date Selection</span>
        </Button>
        <CardTitle className="text-xl sm:text-2xl text-primary pt-8 sm:pt-10">Select Time for {screen.name}</CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm">
          Available slots for {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 sm:pt-2 min-h-[150px]"> {/* Added min-height for loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Fetching available slots...</p>
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5 p-1">
            {availableSlots.map((slot) => (
              <TimeSlotButton
                key={slot.id} // Assuming slot.id from backend is unique for the day/screen
                slot={slot}
                onClick={() => onSlotSelect(slot)}
                isSelected={selectedSlotId === slot.id && slot.isAvailable}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center mt-4 py-6 sm:py-8 text-sm">No slots available for this date and screen. Please try another selection.</p>
        )}
      </CardContent>
    </Card>
  );
}
