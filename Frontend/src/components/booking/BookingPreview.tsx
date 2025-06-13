
'use client';

import type { Screen, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CalendarDays, Clock, Tag } from 'lucide-react';
import Image from 'next/image';

interface BookingPreviewProps {
  screen: Screen;
  date: Date;
  slot: TimeSlot;
  onConfirm: () => void;
  onBack: () => void;
}

export default function BookingPreview({ screen, date, slot, onConfirm, onBack }: BookingPreviewProps) {
  return (
    <Card className="bg-card/90 backdrop-blur-sm border-glow-accent w-full max-w-lg mx-auto overflow-hidden">
      <CardHeader className="relative p-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-2 top-2 sm:left-3 sm:top-3 text-muted-foreground hover:text-primary z-10 bg-card/60 hover:bg-card/90 rounded-full p-2 h-9 w-9 sm:h-10 sm:w-10">
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Back to Time Selection</span>
        </Button>
        <div className="relative w-full h-40 sm:h-56 overflow-hidden">
            <Image
              src={screen.imagePlaceholderUrl}
              alt={screen.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint={screen.imageAiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        </div>
         <div className="p-3 sm:p-4 pb-1 sm:pb-2 pt-3 sm:pt-4 relative -mt-12 sm:-mt-16 text-center">
            <CardTitle className="text-xl sm:text-3xl text-accent drop-shadow-lg">{screen.name}</CardTitle>
            <CardDescription className="text-center mt-1 text-foreground/80 text-xs sm:text-sm">Review your booking details below.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 text-foreground/90 px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex items-center p-2 sm:p-3 bg-background/40 rounded-lg border border-border/70 shadow-sm hover:border-primary/50 transition-all">
          <CalendarDays className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
           <div>
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</span>
            <p className="text-sm sm:text-md font-medium">{date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center p-2 sm:p-3 bg-background/40 rounded-lg border border-border/70 shadow-sm hover:border-primary/50 transition-all">
          <Clock className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          <div>
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Time</span>
            <p className="text-sm sm:text-md font-medium">{slot.time}</p>
          </div>
        </div>
        {slot.price && (
          <div className="flex items-center p-2 sm:p-3 bg-background/40 rounded-lg border border-border/70 shadow-sm hover:border-primary/50 transition-all">
            <Tag className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <div>
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Price</span>
                <p className="text-sm sm:text-md font-medium">₹{slot.price}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-1 sm:pt-2">
        <Button onClick={onConfirm} size="lg" className="w-full btn-glow-primary btn-gradient-primary-accent text-base sm:text-lg py-3 sm:py-4"> {/* Changed to primary-accent gradient */}
          Proceed to Book
        </Button>
      </CardFooter>
    </Card>
  );
}
