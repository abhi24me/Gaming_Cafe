'use client';

import { useState, useEffect } from 'react';
import BookingHistoryItem from '@/components/history/BookingHistoryItem';
import type { Booking } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { BellRing, Award, Loader2, ListX, Hourglass, Gift } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from '@/components/ui/card';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export default function BookingsPage() {
  const { loyaltyPoints, redeemLoyaltyPoints } = useWallet(); 
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();

  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [totalPlaytimeHours, setTotalPlaytimeHours] = useState(0);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    const loadUserBookings = async () => {
      if (!isAuthenticated) {
        setIsLoadingBookings(false);
        setUserBookings([]);
        setTotalPlaytimeHours(0);
        return;
      }
      setIsLoadingBookings(true);
      try {
        const bookingsData = await apiClient<Booking[]>('/bookings');
        const sortedBookings = bookingsData.sort((a, b) => {
            const aIsUpcoming = new Date(a.startTime) > new Date() && a.status === 'upcoming';
            const bIsUpcoming = new Date(b.startTime) > new Date() && b.status === 'upcoming';

            if (aIsUpcoming && !bIsUpcoming) return -1;
            if (!aIsUpcoming && bIsUpcoming) return 1;
            
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        });
        setUserBookings(sortedBookings);

        const now = new Date();
        const totalMilliseconds = sortedBookings
          .filter(b => {
            const endTime = new Date(b.endTime);
            return endTime < now && b.status !== 'cancelled';
          })
          .reduce((acc, booking) => {
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
              return acc + (end.getTime() - start.getTime());
            }
            return acc;
          }, 0);
        
        const totalHours = totalMilliseconds / (1000 * 60 * 60);
        setTotalPlaytimeHours(totalHours);

      } catch (error) {
        toast({
          title: "Error Fetching Bookings",
          description: (error as ApiError).message || "Could not load your booking history.",
          variant: "destructive"
        });
        setUserBookings([]);
        setTotalPlaytimeHours(0);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    if (!isLoadingAuth) { 
      loadUserBookings();
    }
  }, [isAuthenticated, isLoadingAuth, toast]);


  const handleRedeemPoints = async () => {
    setIsRedeeming(true);
    await redeemLoyaltyPoints();
    setIsRedeeming(false);
  };

  const handleSimulateReminder = () => {
    if (!userBookings || userBookings.length === 0) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto w-full shrink-0">
        <Card className="bg-card/80 backdrop-blur-sm border-glow-accent flex flex-col">
          <CardHeader className="p-3 sm:p-4 flex-row items-center justify-between space-x-2">
            <div className="flex items-center">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-accent mr-2 sm:mr-3" />
              <CardTitle className="text-lg sm:text-xl text-accent">Loyalty Points</CardTitle>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{loyaltyPoints}</p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 text-xs text-center text-muted-foreground flex-grow">
            Redeem your points for wallet balance (1 Point = ₹1). A minimum of 100 points is required to redeem.
          </CardContent>
          <CardFooter className="p-3 sm:p-4 pt-0">
            <Button 
                onClick={handleRedeemPoints}
                disabled={loyaltyPoints < 100 || isRedeeming}
                className="w-full btn-glow-accent btn-gradient-primary-accent"
            >
              {isRedeeming ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Gift className="h-4 w-4 mr-2"/>}
              {isRedeeming ? "Redeeming..." : (loyaltyPoints < 100 ? "Need 100+ Points" : `Redeem ${loyaltyPoints} Points`)}
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-glow-primary">
          <CardHeader className="p-3 sm:p-4 flex-row items-center justify-between space-x-2">
            <div className="flex items-center">
              <Hourglass className="h-6 w-6 sm:h-7 sm:w-7 text-primary mr-2 sm:mr-3" />
              <CardTitle className="text-lg sm:text-xl text-primary">Total Playtime</CardTitle>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-accent">
              {totalPlaytimeHours.toFixed(1)} 
              <span className="text-lg text-muted-foreground ml-1">hrs</span>
            </p>
          </CardHeader>
        </Card>
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
