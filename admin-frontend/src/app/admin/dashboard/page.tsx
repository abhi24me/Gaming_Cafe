
'use client';

import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Loader2, AlertTriangle, DatabaseZap } from 'lucide-react';
import type { TopUpRequestFromAPI } from '@/lib/types';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import PendingRequestCard from '@/components/admin/PendingRequestCard';


export default function AdminDashboardPage() {
  const { adminUser, isAdminAuthenticated, isLoadingAdminAuth } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [pendingRequests, setPendingRequests] = useState<TopUpRequestFromAPI[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [errorRequests, setErrorRequests] = useState<string | null>(null);


  useEffect(() => {
    if (!isLoadingAdminAuth && !isAdminAuthenticated) {
      router.replace('/admin/login');
    }
  }, [isLoadingAdminAuth, isAdminAuthenticated, router]);

  const fetchRequests = async () => {
    if (isAdminAuthenticated) {
      setIsLoadingRequests(true);
      setErrorRequests(null);
      try {
        const data = await apiClient<TopUpRequestFromAPI[]>('/admin/topup-requests/pending');
        setPendingRequests(data);
      } catch (error) {
        console.error("Failed to fetch pending requests:", error);
        const apiErrorMsg = error instanceof ApiError ? error.message : "Could not load pending requests.";
        setErrorRequests(apiErrorMsg);
        toast({
          title: "Error Loading Requests",
          description: apiErrorMsg,
          variant: "destructive",
        });
      } finally {
        setIsLoadingRequests(false);
      }
    }
  };

  useEffect(() => {
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminAuthenticated]); 

  const handleUpdateRequestList = () => {
    fetchRequests(); 
  };


  if (isLoadingAdminAuth || (!isAdminAuthenticated && !isLoadingAdminAuth)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">
          {isLoadingAdminAuth ? "Loading Admin Session..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center pt-2">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">
          Admin Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome, {adminUser?.username || 'Admin'}. Manage top-up requests below.
        </p>
      </div>

      <Card className="shadow-lg border-border bg-card">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 p-4 md:p-5 border-b">
            <div className="flex items-center">
                <ListChecks className="h-6 w-6 md:h-7 md:w-7 text-primary mr-2 md:mr-3" />
                <CardTitle className="text-lg md:text-xl text-primary-foreground">Pending Top-Up Requests</CardTitle>
            </div>
            <Button variant="outline" onClick={fetchRequests} disabled={isLoadingRequests} size="sm">
              <DatabaseZap className={`mr-2 h-4 w-4 ${isLoadingRequests ? 'animate-spin' : ''}`} />
              {isLoadingRequests ? 'Refreshing...' : 'Refresh Data'}
            </Button>
        </CardHeader>
        <CardContent className="p-3 md:p-5 min-h-[300px]">
          {isLoadingRequests && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground">Loading requests...</p>
            </div>
          )}
          {!isLoadingRequests && errorRequests && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-semibold">Failed to Load Requests</p>
              <p className="text-sm text-muted-foreground">{errorRequests}</p>
              <Button onClick={fetchRequests} variant="outline" className="mt-4">Retry</Button>
            </div>
          )}
          {!isLoadingRequests && !errorRequests && pendingRequests.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No pending top-up requests at the moment.</p>
          )}
          {!isLoadingRequests && !errorRequests && pendingRequests.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {pendingRequests.map((request) => (
                <PendingRequestCard 
                  key={request._id} 
                  request={request} 
                  onActionSuccess={handleUpdateRequestList}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
