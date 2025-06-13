
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
  // Display only the start time for brevity in the grid
  const displayTime = slot.time.split(' - ')[0];

  return (
    <Button
      variant={slot.isAvailable ? (isSelected ? 'default' : 'outline') : 'ghost'}
      onClick={onClick}
      disabled={!slot.isAvailable}
      className={cn(
        'w-full flex flex-col justify-center items-center text-center px-1 py-2 text-xs h-auto min-h-[3.5rem] sm:min-h-[4rem] relative', // Compact padding, text-xs, min-height, relative for positioning (Off)
        'whitespace-normal break-words', // Allow text wrapping
        slot.isAvailable ? 'border-primary hover:bg-primary/20' : 'text-muted-foreground cursor-not-allowed',
        isSelected && slot.isAvailable && 'bg-primary text-primary-foreground btn-glow-primary',
        !slot.isAvailable && 'line-through'
      )}
      aria-label={`Select time slot ${slot.time}${slot.isAvailable ? '' : ', unavailable'}`}
    >
      <span className="font-medium">{slot.time}</span>
      {!slot.isAvailable && (
          <span className="text-[10px] absolute bottom-1 right-1">(Off)</span>
      )}
    </Button>
  );
}
