
'use client';

import type { TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeSlotButtonProps {
  slot: TimeSlot;
  onClick: () => void;
  isSelected?: boolean;
}

export default function TimeSlotButton({ slot, onClick, isSelected = false }: TimeSlotButtonProps) {
  let displayTime = slot.time; // Fallback to backend-provided time string

  if (slot.startTimeUTC && slot.endTimeUTC) {
    try {
      const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
      const startDate = new Date(slot.startTimeUTC);
      const endDate = new Date(slot.endTimeUTC);

      // Check if dates are valid before formatting
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const localStartTime = startDate.toLocaleTimeString([], options);
        const localEndTime = endDate.toLocaleTimeString([], options);
        displayTime = `${localStartTime} - ${localEndTime}`;
      } else {
        // Handle invalid date strings if necessary, though ISO strings should be valid
        console.warn("Invalid date for slot, using fallback display time:", slot);
      }
    } catch (error) {
      console.error("Error formatting time slot dates:", error);
      // Fallback to slot.time if formatting fails
    }
  }


  return (
    <Button
      variant={slot.isAvailable ? (isSelected ? 'default' : 'outline') : 'ghost'}
      onClick={onClick}
      disabled={!slot.isAvailable}
      className={cn(
        'w-full flex flex-col justify-center items-center text-center px-1 py-2 text-xs h-auto min-h-[3.5rem] sm:min-h-[4rem] relative',
        'whitespace-normal break-words',
        slot.isAvailable ? 'border-primary hover:bg-primary/20' : 'text-muted-foreground cursor-not-allowed',
        isSelected && slot.isAvailable && 'bg-primary text-primary-foreground btn-glow-primary',
        !slot.isAvailable && 'line-through'
      )}
      aria-label={`Select time slot ${displayTime}${slot.isAvailable ? '' : ', unavailable'}`}
    >
      <span className="font-medium">{displayTime}</span>
      {!slot.isAvailable && (
          <span className="text-[10px] absolute bottom-1 right-1">(Off)</span>
      )}
    </Button>
  );
}
