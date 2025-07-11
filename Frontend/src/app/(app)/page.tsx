
'use client';

import { useState, useEffect, useRef } from 'react';
import BookingConfirmationDialog from '@/components/booking/BookingConfirmationDialog';
import ScreenSelector from '@/components/booking/ScreenSelector';
import DateSelector from '@/components/booking/DateSelector';
import TimeSlotSelector from '@/components/booking/TimeSlotSelector';
import BookingPreview from '@/components/booking/BookingPreview';
import type { Screen, TimeSlot, Booking, ScreenAvailabilityResponse, BookingCreationResponse } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { ApiError } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GameCarousel from '@/components/home/GameCarousel';

type BookingStep = 'screen' | 'date' | 'time' | 'confirm';

export default function HomePage() {
  const [apiScreens, setApiScreens] = useState<Screen[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [bookingStep, setBookingStep] = useState<BookingStep>('screen');
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  const [isLoadingScreens, setIsLoadingScreens] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const [currentBookingDetails, setCurrentBookingDetails] = useState<{
    screen: Screen | null;
    slot: TimeSlot | null;
    date: Date | null;
  }>({ screen: null, slot: null, date: null });

  const { toast } = useToast();
  const { fetchWalletData } = useWallet();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const router = useRouter();

  const screenSelectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  useEffect(() => {
    const loadScreens = async () => {
      if (!isAuthenticated) {
        setIsLoadingScreens(false);
        setApiScreens([]);
        return;
      }
      setIsLoadingScreens(true);
      try {
        const screensData = await apiClient<Screen[]>('/screens');
        setApiScreens(screensData);
      } catch (error) {
        toast({ title: "Error Fetching Screens", description: (error as ApiError).message || "Could not load screens.", variant: "destructive" });
        setApiScreens([]);
      } finally {
        setIsLoadingScreens(false);
      }
    };

    if (!isLoadingAuth && isAuthenticated) {
      loadScreens();
    }
  }, [isAuthenticated, isLoadingAuth, toast]);

  const handleScreenSelect = (screen: Screen) => {
    setSelectedScreen(screen);
    setSelectedDate(undefined);
    setSelectedTimeSlot(null);
    setAvailableSlots([]);
    setBookingStep('date');
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (date && selectedScreen?._id) {
      setSelectedDate(date);
      setSelectedTimeSlot(null);
      setBookingStep('time');
      setIsLoadingSlots(true);
      try {
        const formattedDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD for API query
        const slotsData = await apiClient<ScreenAvailabilityResponse>(`/screens/${selectedScreen._id}/availability?date=${formattedDate}`);
        
        let processedSlots = slotsData.slots || [];

        // Check if the selected date is today to disable past slots
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
          const nowClient = new Date(); 
          processedSlots = processedSlots.map(slot => {
            // A slot is only unavailable if its end time is in the past.
            if (slot.endTimeUTC) {
              const slotEndTimeClient = new Date(slot.endTimeUTC);
              if (slotEndTimeClient < nowClient) {
                // Keep the original isAvailable state from backend, but override if past.
                return { ...slot, isAvailable: false };
              }
            }
            return slot;
          });
        }
        setAvailableSlots(processedSlots);

      } catch (error) {
        toast({ title: "Error Fetching Time Slots", description: (error as ApiError).message || "Could not load time slots.", variant: "destructive" });
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    } else if (date === undefined) {
        setSelectedDate(undefined);
        setSelectedTimeSlot(null);
        setAvailableSlots([]);
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setBookingStep('confirm');
  };
  
  const prepareForBookingConfirmation = () => {
    if (selectedScreen && selectedDate && selectedTimeSlot) {
      setCurrentBookingDetails({
        screen: selectedScreen,
        slot: selectedTimeSlot,
        date: selectedDate,
      });
      setIsConfirmDialogOpen(true);
    } else {
      toast({
        title: "Incomplete Selection",
        description: "Please ensure screen, date, and time are selected.",
        variant: "destructive",
      });
      setBookingStep('screen'); 
      setSelectedScreen(null);
      setSelectedDate(undefined);
      setSelectedTimeSlot(null);
      setAvailableSlots([]);
    }
  };
  
  const handleBookingConfirm = async (gamerTag: string, addSecondConsole: boolean) => {
    if (currentBookingDetails.screen?._id && currentBookingDetails.slot?.id && currentBookingDetails.slot?.startTimeUTC && currentBookingDetails.date && currentBookingDetails.slot.price !== undefined) {
      setIsSubmittingBooking(true);
      const bookingPayload = {
        screenId: currentBookingDetails.screen._id,
        date: currentBookingDetails.date.toLocaleDateString('en-CA'), 
        slotId: currentBookingDetails.slot.id,
        startTimeUTC: currentBookingDetails.slot.startTimeUTC,
        pricePaid: currentBookingDetails.slot.price,
        gamerTag: gamerTag,
        addSecondConsole: addSecondConsole,
      };

      try {
        const response = await apiClient<BookingCreationResponse>('/bookings', {
          method: 'POST',
          body: JSON.stringify(bookingPayload),
        });
        
        let displaySlotTime = currentBookingDetails.slot.time; // Fallback
        if (currentBookingDetails.slot.startTimeUTC && currentBookingDetails.slot.endTimeUTC) {
            try {
                const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
                const localStart = new Date(currentBookingDetails.slot.startTimeUTC).toLocaleTimeString([], options);
                const localEnd = new Date(currentBookingDetails.slot.endTimeUTC).toLocaleTimeString([], options);
                displaySlotTime = `${localStart} - ${localEnd}`;
            } catch (e) { /* ignore, use fallback */ }
        }

        toast({
          title: "Booking Confirmed! 🎉",
          description: `Session for ${gamerTag} on ${currentBookingDetails.screen.name} at ${displaySlotTime} is booked. Cost: ₹${(response.booking.pricePaid || 0).toFixed(2)}.`,
          className: "bg-green-600 text-white border-green-700",
        });

        await fetchWalletData(); 

        // Add a delay to allow the toast to be seen before closing the dialog
        setTimeout(() => {
          setIsConfirmDialogOpen(false);
          setIsSubmittingBooking(false); // Reset this too
          setBookingStep('screen');
          setSelectedScreen(null);
          setSelectedDate(undefined);
          setSelectedTimeSlot(null);
          setCurrentBookingDetails({ screen: null, slot: null, date: null });
          setAvailableSlots([]);
        }, 1200); // 1.2 second delay

      } catch (error) {
        console.error("Booking API error:", error);
        toast({
          title: "Booking Failed",
          description: (error as ApiError).message || "Could not complete your booking. Please try again.",
          variant: "destructive",
        });
        setIsSubmittingBooking(false); // On error, stop loading to allow retry
      }
    } else {
        toast({
            title: "Booking Error",
            description: "Missing critical booking details. Please try again.",
            variant: "destructive",
        });
        setIsSubmittingBooking(false); // Ensure loading state is reset
    }
  };

  const handleBackToScreenSelection = () => {
    setSelectedScreen(null);
    setSelectedDate(undefined);
    setSelectedTimeSlot(null);
    setAvailableSlots([]);
    setBookingStep('screen');
  };

  const handleBackToDateSelection = () => {
    setSelectedDate(undefined);
    setSelectedTimeSlot(null);
    setAvailableSlots([]);
    setBookingStep('date');
  };

  const handleBackToTimeSelection = () => {
    setSelectedTimeSlot(null);
    setBookingStep('time');
  };

  const handleCarouselClick = () => {
    screenSelectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoadingAuth || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">
          {isLoadingAuth ? "Authenticating..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  const renderStepContent = () => {
    if (isLoadingScreens && bookingStep === 'screen') {
        return (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3">Loading Screens...</p>
          </div>
        );
    }

    switch (bookingStep) {
      case 'screen':
        return <ScreenSelector screens={apiScreens} onScreenSelect={handleScreenSelect} />;
      case 'date':
        return selectedScreen ? (
          <DateSelector
            screen={selectedScreen}
            selectedDate={selectedDate}
            onDateChange={handleDateSelect}
            onBack={handleBackToScreenSelection}
          />
        ) : null;
      case 'time':
        return selectedScreen && selectedDate ? (
          <TimeSlotSelector
            screen={selectedScreen}
            date={selectedDate}
            availableSlots={availableSlots}
            selectedSlotId={selectedTimeSlot?.id || null}
            onSlotSelect={handleTimeSlotSelect}
            onBack={handleBackToDateSelection}
            isLoading={isLoadingSlots}
          />
        ) : null;
      case 'confirm':
        return selectedScreen && selectedDate && selectedTimeSlot ? (
          <BookingPreview
            screen={selectedScreen}
            date={selectedDate}
            slot={selectedTimeSlot}
            onConfirm={prepareForBookingConfirmation}
            onBack={handleBackToTimeSelection}
          />
        ) : null;
      default:
        return <p>Something went wrong. Please refresh.</p>;
    }
  };


  return (
    <>
      <div className="space-y-8">

          {bookingStep === 'screen' && (
            <section>
                <div className="text-center">
                    <h3 className="text-2xl sm:text-3xl font-bold text-primary">Featured Games</h3>
                    <p className="text-muted-foreground mt-2">A glimpse of our exciting library.</p>
                </div>
                <GameCarousel onImageClick={handleCarouselClick} />
            </section>
          )}

          <div ref={screenSelectionRef} className="scroll-mt-4">
            {renderStepContent()}
          </div>
      </div>

      <BookingConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        screen={currentBookingDetails.screen}
        slot={currentBookingDetails.slot}
        date={currentBookingDetails.date}
        onConfirm={handleBookingConfirm}
        isSubmitting={isSubmittingBooking}
      />
    </>
  );
}
