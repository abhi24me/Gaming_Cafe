
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Loader2, AlertTriangle, RefreshCw, Edit, PlusCircle, Trash2 } from 'lucide-react';
import type { ScreenWithPricing, PriceOverride } from '@/lib/types';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import AddPriceOverrideDialog from '@/components/admin/pricing/AddPriceOverrideDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function convertUtcHHMMtoIstHHMM(utcHHMM: string): string {
  if (!utcHHMM || !utcHHMM.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
    return "Invalid Time";
  }
  const [hours, minutes] = utcHHMM.split(':').map(Number);
  const tempDate = new Date();
  tempDate.setUTCHours(hours, minutes, 0, 0);

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hourCycle: 'h23'
    });
    return formatter.format(tempDate);
  } catch (error) {
    return "Format Error";
  }
}

export default function ScreenPricingPage() {
  const { isAdminAuthenticated, isLoadingAdminAuth } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [screens, setScreens] = useState<ScreenWithPricing[]>([]);
  const [isLoadingScreens, setIsLoadingScreens] = useState(true);
  const [errorScreens, setErrorScreens] = useState<string | null>(null);

  const [isAddOverrideDialogOpen, setIsAddOverrideDialogOpen] = useState(false);
  const [selectedScreenForOverride, setSelectedScreenForOverride] = useState<ScreenWithPricing | null>(null);

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [overrideToRemove, setOverrideToRemove] = useState<{ screenId: string; overrideId: string; screenName: string } | null>(null);
  const [isDeletingOverride, setIsDeletingOverride] = useState(false);

  const fetchScreens = useCallback(async () => {
    if (isAdminAuthenticated) {
      setIsLoadingScreens(true);
      setErrorScreens(null);
      try {
        const data = await apiClient<ScreenWithPricing[]>('/admin/screens');
        setScreens(data);
      } catch (error) {
        console.error("Failed to fetch screens for pricing:", error);
        const apiErrorMsg = error instanceof ApiError ? error.message : "Could not load screen pricing data.";
        setErrorScreens(apiErrorMsg);
        toast({
          title: "Error Loading Screens",
          description: apiErrorMsg,
          variant: "destructive",
        });
      } finally {
        setIsLoadingScreens(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminAuthenticated, toast]);

  useEffect(() => {
    if (!isLoadingAdminAuth && !isAdminAuthenticated) {
      router.replace('/admin/login');
    } else if (!isLoadingAdminAuth && isAdminAuthenticated) {
      fetchScreens();
    }
  }, [isLoadingAdminAuth, isAdminAuthenticated, router, fetchScreens]);

  const formatDaysOfWeek = (days?: number[]): string => {
    if (!days || days.length === 0) return 'N/A';
    return days.sort((a,b) => a-b).map(day => DAYS_OF_WEEK[day] || `Day ${day}`).join(', ');
  };

  const handleOpenAddOverrideDialog = (screen: ScreenWithPricing) => {
    setSelectedScreenForOverride(screen);
    setIsAddOverrideDialogOpen(true);
  };

  const handleOverrideAddedOrRemoved = () => {
    fetchScreens();
  };

  const confirmRemoveOverride = (screenId: string, overrideId: string, screenName: string) => {
    setOverrideToRemove({ screenId, overrideId, screenName });
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleRemoveOverride = async () => {
    if (!overrideToRemove || !overrideToRemove.overrideId) {
        toast({title: "Error", description: "Override ID is missing.", variant: "destructive"});
        return;
    }
    setIsDeletingOverride(true);
    try {
      await apiClient(`/admin/screens/${overrideToRemove.screenId}/overrides/${overrideToRemove.overrideId}`, {
        method: 'DELETE',
      });
      toast({
        title: 'Success!',
        description: `Price override removed from ${overrideToRemove.screenName}.`,
        className: 'bg-green-600 text-white border-green-700',
      });
      setIsConfirmDeleteDialogOpen(false);
      setOverrideToRemove(null);
      handleOverrideAddedOrRemoved();
    } catch (error) {
      toast({
        title: 'Failed to Remove Override',
        description: error instanceof ApiError ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingOverride(false);
    }
  };


  if (isLoadingAdminAuth && !isAdminAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">Loading Admin Session...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 md:space-y-8">
        <div className="text-center pt-2">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">
            Screen Pricing Management
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage pricing for each gaming screen.
          </p>
        </div>

        <Card className="shadow-lg border-border bg-card">
          <CardHeader className="p-4 md:p-5 border-b flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center">
                  <DollarSign className="h-6 w-6 md:h-7 md:w-7 text-primary mr-2 md:mr-3" />
                  <CardTitle className="text-lg md:text-xl text-primary-foreground">Screen Prices</CardTitle>
              </div>
              <Button variant="outline" onClick={fetchScreens} disabled={isLoadingScreens} size="sm" className="text-xs md:text-sm">
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 md:h-4 md:w-4 ${isLoadingScreens ? 'animate-spin' : ''}`} />
                  {isLoadingScreens ? 'Refreshing...' : 'Refresh Data'}
              </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingScreens && (
              <div className="flex items-center justify-center py-10 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <p className="text-muted-foreground">Loading screen data...</p>
              </div>
            )}
            {!isLoadingScreens && errorScreens && (
              <div className="flex flex-col items-center justify-center py-10 text-center min-h-[300px] px-4 md:px-5">
                <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
                <p className="text-destructive font-semibold">Failed to Load Screens</p>
                <p className="text-sm text-muted-foreground">{errorScreens}</p>
                <Button onClick={fetchScreens} variant="outline" className="mt-4 text-xs md:text-sm">Retry</Button>
              </div>
            )}
            {!isLoadingScreens && !errorScreens && screens.length === 0 && (
              <p className="text-center text-muted-foreground py-10 min-h-[300px] px-4 md:px-5">No screens found. Configure screens first.</p>
            )}
            {!isLoadingScreens && !errorScreens && screens.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 py-3">Screen</TableHead>
                      <TableHead className="hidden sm:table-cell px-3 py-3">Base Price</TableHead>
                      <TableHead className="px-3 py-3">Active</TableHead>
                      <TableHead className="hidden md:table-cell text-center px-3 py-3">Price Overrides (IST)</TableHead>
                      <TableHead className="text-right px-3 py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {screens.map((screen) => (
                      <TableRow key={screen._id}>
                        <TableCell className="px-3 py-2">
                          <div className="font-medium text-foreground text-sm">{screen.name}</div>
                          <div className="hidden sm:block text-xs text-muted-foreground truncate max-w-xs">{screen.description}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-medium px-3 py-2">
                          ₹{screen.basePrice.toFixed(2)}
                          <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => toast({title: "Edit Base Price", description: "Functionality to edit base price coming soon."})}>
                              <Edit className="h-3 w-3 text-blue-500"/>
                          </Button>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Badge variant={screen.isActive ? "default" : "destructive"} className={cn("text-xs font-normal whitespace-nowrap", screen.isActive ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600" : "bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600")}>
                            {screen.isActive ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell px-3 py-2">
                          <div className="flex flex-col items-center space-y-1">
                            {screen.priceOverrides && screen.priceOverrides.length > 0 ? (
                              <div className="space-y-1 max-w-xs w-full">
                                {screen.priceOverrides.map((override, index) => (
                                  <div key={override._id || `override-${index}-${screen._id}`} className="text-xs p-1.5 bg-muted/50 rounded border border-dashed text-muted-foreground flex justify-between items-center w-full">
                                    <span className="truncate">
                                      {formatDaysOfWeek(override.daysOfWeek)}: {convertUtcHHMMtoIstHHMM(override.startTimeUTC)}-{convertUtcHHMMtoIstHHMM(override.endTimeUTC)} @ ₹{override.price.toFixed(2)}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 shrink-0" onClick={() => confirmRemoveOverride(screen._id, override._id!, screen.name)}>
                                        <Trash2 className="h-3 w-3 text-red-500"/>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                            <Button variant="outline" size="sm" className="mt-2 h-7 px-2 py-1 text-xs" onClick={() => handleOpenAddOverrideDialog(screen)}>
                                <PlusCircle className="h-3.5 w-3.5 mr-1"/> Add
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => toast({title: "Edit Screen", description: "More screen editing options coming soon."})}>
                              <Edit className="mr-1 h-3.5 w-3.5"/> Manage
                          </Button>
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

      {selectedScreenForOverride && (
        <AddPriceOverrideDialog
          isOpen={isAddOverrideDialogOpen}
          onOpenChange={setIsAddOverrideDialogOpen}
          screenId={selectedScreenForOverride._id}
          screenName={selectedScreenForOverride.name}
          onOverrideAdded={handleOverrideAddedOrRemoved}
        />
      )}

      {overrideToRemove && (
        <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this price override from {overrideToRemove.screenName}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingOverride}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveOverride}
                disabled={isDeletingOverride}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingOverride ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
