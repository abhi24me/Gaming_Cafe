
'use client';

import { useState, useEffect } from 'react';
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

    if (!isLoadingAuth) {
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
        setAvailableSlots(slotsData.slots || []);
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
      setBookingStep('screen'); // Reset to start
      setSelectedScreen(null);
      setSelectedDate(undefined);
      setSelectedTimeSlot(null);
      setAvailableSlots([]);
    }
  };
  
  const handleBookingConfirm = async (gamerTag: string) => {
    if (currentBookingDetails.screen?._id && currentBookingDetails.slot && currentBookingDetails.date) {
      setIsSubmittingBooking(true);
      const bookingPayload = {
        screenId: currentBookingDetails.screen._id,
        date: currentBookingDetails.date.toLocaleDateString('en-CA'), // YYYY-MM-DD for backend
        timeSlot: currentBookingDetails.slot.time, // The "HH:MM AM/PM - HH:MM AM/PM" string
        pricePaid: currentBookingDetails.slot.price || 0,
        gamerTag: gamerTag,
      };

      try {
        // Backend returns BookingCreationResponse which includes booking, transaction, newBalance, newLoyaltyPoints
        await apiClient<BookingCreationResponse>('/bookings', {
          method: 'POST',
          body: JSON.stringify(bookingPayload),
        });
        
        toast({
          title: "Booking Confirmed! 🎉",
          description: `Session for ${gamerTag} on ${currentBookingDetails.screen.name} at ${currentBookingDetails.slot.time} is booked. Cost: ₹${(currentBookingDetails.slot.price || 0).toFixed(2)}.`,
          className: "bg-green-600 text-white border-green-700",
        });

        await fetchWalletData(); // Refresh wallet balance and loyalty points from context

        setIsConfirmDialogOpen(false);
        setBookingStep('screen');
        setSelectedScreen(null);
        setSelectedDate(undefined);
        setSelectedTimeSlot(null);
        setCurrentBookingDetails({ screen: null, slot: null, date: null });
        setAvailableSlots([]);

      } catch (error) {
        console.error("Booking API error:", error);
        toast({
          title: "Booking Failed",
          description: (error as ApiError).message || "Could not complete your booking. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmittingBooking(false);
      }
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

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated && !isLoadingAuth) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4 text-primary">Welcome to Wello!</h2>
        <p className="text-muted-foreground">Please log in to book your gaming session.</p>
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
          <div className="text-center mb-8 pt-4">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary text-transparent bg-clip-text mb-2 inline-block">Book Your Gaming Session</h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                {bookingStep === 'screen' && "Choose your battle station! Select a screen to begin."}
                {bookingStep === 'date' && selectedScreen && `Lock in your game day for ${selectedScreen.name}.`}
                {bookingStep === 'time' && selectedScreen && selectedDate && `Select your prime time for ${selectedScreen.name} on ${selectedDate.toLocaleDateString()}.`}
                {bookingStep === 'confirm' && "One last check! Make sure everything's perfect."}
              </p>
          </div>
          {renderStepContent()}
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
