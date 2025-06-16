
'use client';

import type { Booking, Screen } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, UserCircle, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BookingHistoryItemProps {
  booking: Booking;
}

export default function BookingHistoryItem({ booking }: BookingHistoryItemProps) {
  const statusColors = {
    upcoming: 'bg-primary/80 text-primary-foreground border-primary',
    completed: 'bg-green-600/80 text-white border-green-600',
    cancelled: 'bg-destructive/80 text-destructive-foreground border-destructive',
    active: 'bg-yellow-500/80 text-black border-yellow-500',
  };

  const bookedAtDate = new Date(booking.bookedAt);
  const sessionDate = new Date(booking.startTime);

  const screenName = booking.screenName || 
                    (booking.screen && typeof booking.screen === 'object' ? (booking.screen as Screen).name : 'Gaming Screen');
  
  const screenImage = (booking.screen && typeof booking.screen === 'object' ? (booking.screen as Screen).imagePlaceholderUrl : 'https://placehold.co/300x200.png');
  
  const screenImageHint = (booking.screen && typeof booking.screen === 'object' ? (booking.screen as Screen).imageAiHint : 'gaming');


  return (
    <Card className="bg-card/80 backdrop-blur-sm border-glow-primary flex flex-col overflow-hidden group">
        <div className="relative w-full h-32 sm:h-40 overflow-hidden">
            <Image
                src={screenImage}
                alt={screenName}
                layout="fill"
                objectFit="cover"
                data-ai-hint={screenImageHint}
                className="group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        </div>
      <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2 relative -mt-10 z-10">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg sm:text-xl text-primary drop-shadow-md">{screenName}</CardTitle>
          <Badge variant="outline" className={cn("capitalize text-xs px-1.5 py-0.5 sm:px-2", statusColors[booking.status] || 'bg-muted text-muted-foreground')}>
            {booking.status}
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm text-foreground/70 drop-shadow-sm">
          Booked: {bookedAtDate.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5 sm:space-y-2 text-foreground/90 p-3 sm:p-4 pt-1 sm:pt-2 flex-grow">
        <div className="flex items-center text-xs sm:text-sm">
          <CalendarDays className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
          <span>{sessionDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm">
          <Clock className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
          <span>{sessionDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
        </div>
        {booking.gamerTagAtBooking && (
            <div className="flex items-center text-xs sm:text-sm">
                <UserCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
                <span>Tag: {booking.gamerTagAtBooking}</span>
            </div>
        )}
        {booking.pricePaid !== undefined && (
           <div className="flex items-center text-xs sm:text-sm">
            <IndianRupee className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
            <span>Paid: ₹{booking.pricePaid.toFixed(2)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
