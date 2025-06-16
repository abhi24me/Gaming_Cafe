
'use client';

import { useState, useEffect } from 'react';
import BookingHistoryItem from '@/components/history/BookingHistoryItem';
import type { Booking } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { BellRing, Award, Loader2, ListX } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card'; // CardContent was unused
import apiClient, { ApiError } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export default function BookingsPage() {
  const { loyaltyPoints } = useWallet(); 
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();

  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    const loadUserBookings = async () => {
      if (!isAuthenticated) {
        setIsLoadingBookings(false);
        setUserBookings([]);
        return;
      }
      setIsLoadingBookings(true);
      try {
        const bookingsData = await apiClient<Booking[]>('/bookings');
        // Sort bookings: upcoming first, then by startTime date descending
        const sortedBookings = bookingsData.sort((a, b) => {
            const aIsUpcoming = new Date(a.startTime) > new Date() && a.status === 'upcoming';
            const bIsUpcoming = new Date(b.startTime) > new Date() && b.status === 'upcoming';

            if (aIsUpcoming && !bIsUpcoming) return -1;
            if (!aIsUpcoming && bIsUpcoming) return 1;
            
            // If both are upcoming (or both not), sort by startTime descending
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        });
        setUserBookings(sortedBookings);
      } catch (error) {
        toast({
          title: "Error Fetching Bookings",
          description: (error as ApiError).message || "Could not load your booking history.",
          variant: "destructive"
        });
        setUserBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    if (!isLoadingAuth) { 
      loadUserBookings();
    }
  }, [isAuthenticated, isLoadingAuth, toast]);


  const handleSimulateReminder = () => {
    if (!userBookings || userBookings.length === 0) { // Check length
        toast({ title: "No Bookings", description: "Cannot simulate reminder without bookings.", variant: "destructive"});
        return;
    }
    const upcomingBookings = userBookings.filter(b => b.status === 'upcoming' && new Date(b.startTime) > new Date());
    let reminderTitle = "🎮 Session Reminder!";
    let reminderDescription = "You have an upcoming session soon. Check your bookings!";

    if (upcomingBookings.length > 0) {
      const soonestBooking = upcomingBookings.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )[0];
      
      const sessionDate = new Date(soonestBooking.startTime);
      const timeDisplay = sessionDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      const screenName = soonestBooking.screenName || 
                         (soonestBooking.screen && typeof soonestBooking.screen === 'object' ? soonestBooking.screen.name : 'Unknown Screen');

      reminderDescription = `Your session for '${screenName}' at ${timeDisplay} is coming up! Get ready!`;
    }

    toast({
      title: reminderTitle,
      description: reminderDescription,
      className: "bg-primary text-primary-foreground border-primary/70",
      duration: 7000,
    });
  };

  if (isLoadingAuth || isLoadingBookings) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">
          {isLoadingAuth ? "Authenticating..." : "Loading Your Bookings..."}
        </p>
      </div>
    );
  }
  
  if (!isAuthenticated && !isLoadingAuth) {
     return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4 text-primary">Access Denied</h2>
        <p className="text-muted-foreground">Please log in to view your bookings.</p>
      </div>
    );
  }


  return (
    <div className="space-y-6 sm:space-y-8 flex flex-col h-full">
      <div className="text-center pt-4 shrink-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary text-transparent bg-clip-text mb-2 inline-block">Your Gaming Journey</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Review your past and upcoming sessions.</p>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm border-glow-accent mx-auto w-full max-w-md shrink-0">
        <CardHeader className="p-3 sm:p-4 flex-row items-center justify-between space-x-2">
          <div className="flex items-center">
            <Award className="h-6 w-6 sm:h-7 sm:w-7 text-accent mr-2 sm:mr-3" />
            <CardTitle className="text-lg sm:text-xl text-accent">Loyalty Points</CardTitle>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary">{loyaltyPoints}</p>
        </CardHeader>
      </Card>


      <div className="flex justify-center mb-4 sm:mb-6 shrink-0">
        <Button onClick={handleSimulateReminder} variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary btn-glow-primary">
          <BellRing className="mr-2 h-4 w-4" />
          Simulate Session Reminder
        </Button>
      </div>

      <div className="flex-grow overflow-hidden">
        {userBookings && userBookings.length > 0 ? (
          <ScrollArea className="h-full">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 pb-4">
            {userBookings.map((booking) => (
              <BookingHistoryItem key={booking._id} booking={booking} />
            ))}
          </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <ListX className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No bookings yet. Time to play!</p>
            <p className="text-sm text-muted-foreground">Book a session from the Home page to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
