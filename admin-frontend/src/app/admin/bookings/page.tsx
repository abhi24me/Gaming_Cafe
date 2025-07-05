
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarClock, Loader2, AlertTriangle, RefreshCw, Calendar, FilterX } from 'lucide-react';
import type { AdminBookingFromAPI } from '@/lib/types';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminBookingsPage() {
  const { isAdminAuthenticated, isLoadingAdminAuth } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<AdminBookingFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const fetchBookings = useCallback(async () => {
    if (isAdminAuthenticated) {
      setIsLoading(true);
      setError(null);
      try {
        let url = '/admin/bookings';
        if (selectedDate) {
          url += `?date=${selectedDate}`;
        }
        const data = await apiClient<AdminBookingFromAPI[]>(url);
        setBookings(data);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
        const apiErrorMsg = error instanceof ApiError ? error.message : "Could not load bookings.";
        setError(apiErrorMsg);
        toast({
          title: "Error Loading Bookings",
          description: apiErrorMsg,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [isAdminAuthenticated, toast, selectedDate]);

  useEffect(() => {
    if (!isLoadingAdminAuth && isAdminAuthenticated) {
      fetchBookings();
    }
  }, [isLoadingAdminAuth, isAdminAuthenticated, fetchBookings]);
  
  const handleClearFilter = () => {
    setSelectedDate('');
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    });
  };

  if (isLoadingAdminAuth && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">
          Loading...
        </p>
      </div>
    );
  }
  
  const pageTitle = selectedDate 
    ? `Bookings for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'long' })}`
    : "Upcoming Bookings";
  const pageDescription = selectedDate 
    ? "Viewing all scheduled sessions for the selected date."
    : "View all scheduled upcoming gaming sessions.";


  return (
    <div className="space-y-6">
      <div className="text-center pt-2">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">
          {pageTitle}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {pageDescription}
        </p>
      </div>

      <Card className="shadow-lg border-border bg-card">
        <CardHeader className="p-4 md:p-5 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center self-start sm:self-center">
            <CalendarClock className="h-6 w-6 md:h-7 md:w-7 text-primary mr-2 md:mr-3" />
            <CardTitle className="text-lg md:text-xl text-primary-foreground">Scheduled Sessions</CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
             <div className="flex items-center gap-2">
                <Label htmlFor="booking-date" className="text-sm text-muted-foreground hidden sm:block">Date:</Label>
                <Input
                    id="booking-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-background/70 h-9 text-sm w-full sm:w-auto"
                />
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleClearFilter} disabled={!selectedDate} size="sm" className="w-full sm:w-auto">
                    <FilterX className="mr-2 h-4 w-4" /> Clear
                </Button>
                <Button variant="outline" onClick={fetchBookings} disabled={isLoading} size="sm" className="w-full sm:w-auto">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-center min-h-[300px] px-5">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-semibold">Failed to Load Bookings</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={fetchBookings} variant="outline" className="mt-4">Retry</Button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center min-h-[300px] px-5">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4"/>
                <p className="text-lg text-muted-foreground">No bookings found for the selected criteria.</p>
                {selectedDate && <p className="text-sm text-muted-foreground">Try clearing the filter to see all upcoming bookings.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-3 py-3">User</TableHead>
                    <TableHead className="hidden sm:table-cell px-3 py-3">Screen</TableHead>
                    <TableHead className="px-3 py-3">Start Time (IST)</TableHead>
                    <TableHead className="hidden md:table-cell px-3 py-3">End Time (IST)</TableHead>
                    <TableHead className="text-right px-3 py-3">Price Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell className="px-3 py-2">
                        <div className="font-medium text-foreground truncate max-w-[120px] sm:max-w-[150px]">
                          {booking.user?.gamerTag || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {booking.screen?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px] hidden sm:block">
                          {booking.user?.email || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-3 py-2">
                          {booking.screen?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm whitespace-nowrap">
                        {formatDateTime(booking.startTime)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell px-3 py-2 text-sm whitespace-nowrap">
                        {formatDateTime(booking.endTime)}
                      </TableCell>
                      <TableCell className="text-right font-medium px-3 py-2">
                        ₹{booking.pricePaid.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
