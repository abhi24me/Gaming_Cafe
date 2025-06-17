
'use client';

import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History as HistoryIcon, Loader2, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import type { TopUpRequestFromAPI } from '@/lib/types';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';

export default function TopUpHistoryPage() {
  const { isAdminAuthenticated, isLoadingAdminAuth } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [requestsHistory, setRequestsHistory] = useState<TopUpRequestFromAPI[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [selectedRequestReceipt, setSelectedRequestReceipt] = useState<string | null>(null);


  const fetchHistory = async () => {
    if (isAdminAuthenticated) {
      setIsLoadingHistory(true);
      setErrorHistory(null);
      try {
        const data = await apiClient<TopUpRequestFromAPI[]>('/admin/topup-requests/history');
        setRequestsHistory(data);
      } catch (error) {
        console.error("Failed to fetch top-up history:", error);
        const apiErrorMsg = error instanceof ApiError ? error.message : "Could not load request history.";
        setErrorHistory(apiErrorMsg);
        toast({
          title: "Error Loading History",
          description: apiErrorMsg,
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    }
  };

  useEffect(() => {
    if (!isLoadingAdminAuth && !isAdminAuthenticated) {
      router.replace('/admin/login');
    } else if (!isLoadingAdminAuth && isAdminAuthenticated) {
      fetchHistory();
    }
  }, [isLoadingAdminAuth, isAdminAuthenticated, router]); // fetchHistory removed from deps to avoid loop on its re-creation


  const getStatusBadgeVariant = (status: TopUpRequestFromAPI['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
    }
  };
  
  const handleViewReceipt = (request: TopUpRequestFromAPI) => {
    if (request.receiptData && request.receiptMimeType && Array.isArray(request.receiptData.data)) {
      try {
        const buffer = Buffer.from(request.receiptData.data);
        const base64String = buffer.toString('base64');
        setSelectedRequestReceipt(`data:${request.receiptMimeType};base64,${base64String}`);
      } catch (e) {
        toast({ title: "Error", description: "Could not display receipt.", variant: "destructive"});
        setSelectedRequestReceipt(null);
      }
    } else {
       toast({ title: "No Receipt", description: "No receipt data available for this request.", variant: "default"});
       setSelectedRequestReceipt(null);
    }
  };


  if (isLoadingAdminAuth || (!isAdminAuthenticated && !isLoadingAdminAuth)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-280px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">
          {isLoadingAdminAuth ? "Loading Admin Session..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">
          Top-Up Request History
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View all submitted top-up requests and their current status.
        </p>
      </div>

      <Card className="shadow-lg border-border bg-card">
        <CardHeader className="flex-row items-center justify-between space-x-2 p-4 sm:p-5 border-b">
            <div className="flex items-center">
                <HistoryIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary mr-2 sm:mr-3" />
                <CardTitle className="text-lg sm:text-xl text-primary-foreground">All Requests</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoadingHistory}>
              <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden sm:inline">{isLoadingHistory ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
        </CardHeader>
        <CardContent className="p-0"> {/* Remove padding for full-width table */}
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-10 min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          )}
          {!isLoadingHistory && errorHistory && (
            <div className="flex flex-col items-center justify-center py-10 text-center min-h-[200px]">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-semibold">Failed to Load History</p>
              <p className="text-sm text-muted-foreground">{errorHistory}</p>
              <Button onClick={fetchHistory} variant="outline" className="mt-4">Retry</Button>
            </div>
          )}
          {!isLoadingHistory && !errorHistory && requestsHistory.length === 0 && (
            <p className="text-center text-muted-foreground py-10 min-h-[200px]">No top-up requests found.</p>
          )}
          {!isLoadingHistory && !errorHistory && requestsHistory.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] sm:w-[180px]">User</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead>Reviewed At</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="hidden md:table-cell">Admin Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsHistory.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{request.user?.gamerTag || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{request.user?.email || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="font-medium">₹{request.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(request.requestedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize text-xs font-normal", getStatusBadgeVariant(request.status))}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.reviewedBy?.username || 'N/A'}</TableCell>
                      <TableCell>{request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>
                        {request.receiptData ? (
                            <Button variant="outline" size="sm" onClick={() => handleViewReceipt(request)} className="h-7 px-2 py-1 text-xs">
                                <Eye className="h-3.5 w-3.5"/>
                            </Button>
                        ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground truncate max-w-[150px]">{request.adminNotes || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequestReceipt && (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRequestReceipt(null)}
        >
            <Card className="max-w-lg w-full max-h-[80vh] overflow-auto bg-card p-2" onClick={(e) => e.stopPropagation()}>
                <CardHeader className="p-2">
                    <CardTitle className="text-sm text-primary">Payment Receipt</CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setSelectedRequestReceipt(null)}
                    > X </Button>
                </CardHeader>
                <CardContent className="p-2">
                    <div className="relative w-full aspect-[2/3] sm:aspect-auto sm:h-[60vh] bg-muted/30 rounded">
                        <NextImage src={selectedRequestReceipt} alt="Receipt" layout="fill" objectFit="contain" data-ai-hint="receipt document" />
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

    