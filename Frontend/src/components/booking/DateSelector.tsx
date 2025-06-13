
'use client';

import type { Screen } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface DateSelectorProps {
  screen: Screen;
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  onBack: () => void;
}

export default function DateSelector({ screen, selectedDate, onDateChange, onBack }: DateSelectorProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-glow-primary w-full max-w-md mx-auto">
      <CardHeader className="relative text-center p-4 sm:p-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-2 top-2 sm:left-3 sm:top-3 text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to Screen Selection</span>
        </Button>
        <CardTitle className="text-xl sm:text-2xl text-primary pt-8 sm:pt-10">Select Date for {screen.name}</CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm">Choose a date to see available time slots.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-3 sm:p-4 pt-0 sm:pt-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          className="rounded-md border border-border bg-background/50 p-2 sm:p-3"
          disabled={(date) => date < today}
        />
      </CardContent>
    </Card>
  );
}
