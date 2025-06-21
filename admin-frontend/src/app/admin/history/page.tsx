
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History as HistoryIcon, Loader2, AlertTriangle, RefreshCw, Eye, Download, FilterX, Search, Trash2, MessageSquare } from 'lucide-react';
import type { TopUpRequestFromAPI } from '@/lib/types';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import NextImage from 'next/image'; 
import { X } from 'lucide-react'; 

export default function TopUpHistoryPage() {
  const { isAdminAuthenticated, isLoadingAdminAuth } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname(); 
  const { toast } = useToast();

  const [requestsHistory, setRequestsHistory] = useState<TopUpRequestFromAPI[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [selectedRequestReceipt, setSelectedRequestReceipt] = useState<string | null>(null); 

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminUsernameQuery, setAdminUsernameQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const fetchHistory = useCallback(async () => {
    if (isAdminAuthenticated) {
      setIsLoadingHistory(true);
      setErrorHistory(null);
      
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (adminUsernameQuery) queryParams.append('adminUsername', adminUsernameQuery);
      if (userSearchQuery) queryParams.append('userSearch', userSearchQuery);

      try {
        const data = await apiClient<TopUpRequestFromAPI[]>(`/admin/topup-requests/history?${queryParams.toString()}`);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminAuthenticated, toast, startDate, endDate, adminUsernameQuery, userSearchQuery]); 

  useEffect(() => {
    if (!isLoadingAdminAuth && !isAdminAuthenticated) {
      router.replace('/admin/login');
    } else if (!isLoadingAdminAuth && isAdminAuthenticated) {
      fetchHistory();
    }
  }, [isLoadingAdminAuth, isAdminAuthenticated, router, fetchHistory]);

  const handleApplyFilters = () => {
    fetchHistory();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setAdminUsernameQuery('');
    setUserSearchQuery('');
    // The useCallback for fetchHistory will be re-created, but useEffect won't run it automatically.
    // We need to trigger it manually after clearing state.
    // A simple way is to wrap it in a function that sets state and then calls fetch.
    // For now, let's assume this is a simple implementation and call it directly,
    // though a more robust solution might use a state management library or another useEffect trigger.
    // Let's call fetch manually after state updates.
    // We'll call it inside a timeout to allow state to update before fetch uses it.
    setTimeout(() => fetchHistory(), 0);
  };


  const getStatusBadgeVariant = (status: TopUpRequestFromAPI['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-600/30 dark:text-yellow-300 dark:border-yellow-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600';
    }
  };
  
  const handleViewReceipt = (request: TopUpRequestFromAPI) => {
    let buffer: Buffer | undefined;

    if (request.receiptData && request.receiptMimeType) {
      try {
        // Handle both backend buffer formats
        if (typeof request.receiptData === 'object' && 'data' in request.receiptData && Array.isArray((request.receiptData as any).data)) {
          buffer = Buffer.from((request.receiptData as any).data);
        } else if (typeof request.receiptData === 'string') {
          buffer = Buffer.from(request.receiptData, 'base64');
        }

        if (buffer) {
          const base64String = buffer.toString('base64');
          setSelectedRequestReceipt(`data:${request.receiptMimeType};base64,${base64String}`);
        } else {
           toast({ title: "Receipt Data Error", description: "Receipt data is not in an expected format.", variant: "destructive"});
           setSelectedRequestReceipt(null);
        }
      } catch (e) {
        console.error("Error converting receipt data:", e);
        toast({ title: "Receipt Display Error", description: "Could not display receipt.", variant: "destructive"});
        setSelectedRequestReceipt(null);
      }
    } else {
       toast({ title: "Receipt Data Error", description: "Receipt data or MIME type is missing.", variant: "destructive"});
       setSelectedRequestReceipt(null);
    }
  };

  const handleDownloadReport = () => {
    if (requestsHistory.length === 0) {
      toast({ title: "No Data", description: "There is no history data to download.", variant: "default" });
      return;
    }

    const csvHeaders = [
      "Request ID", "User GamerTag", "User Email", "Amount (₹)", "Requested At (IST)", "Status",
      "Reviewed By", "Reviewed At (IST)", "Admin Notes"
    ];

    const csvRows = requestsHistory.map(request => {
      const requestedAtIST = request.requestedAt 
        ? new Date(request.requestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
        : 'N/A';
      const reviewedAtIST = request.reviewedAt 
        ? new Date(request.reviewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
        : 'N/A';
      const adminNotes = request.adminNotes ? `"${request.adminNotes.replace(/"/g, '""')}"` : 'N/A';

      return [
        request._id,
        request.user?.gamerTag || 'N/A',
        request.user?.email || 'N/A',
        request.amount.toFixed(2),
        requestedAtIST,
        request.status,
        request.reviewedBy?.username || 'N/A',
        reviewedAtIST,
        adminNotes
      ].join(',');
    });

    const csvString = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `topup_requests_history_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); 
    } else {
        toast({ title: "Download Failed", description: "Your browser doesn't support direct downloads.", variant: "destructive"});
    }
  };


  if (isLoadingAdminAuth || (!isAdminAuthenticated && pathname !== '/admin/login')) {
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
          Top-Up Request History
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          View and filter submitted top-up requests.
        </p>
      </div>

      <Card className="shadow-lg border-border bg-card">
        <CardHeader className="p-4 md:p-5 border-b">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center">
                    <HistoryIcon className="h-6 w-6 md:h-7 md:w-7 text-primary mr-2 md:mr-3" />
                    <CardTitle className="text-lg md:text-xl text-primary-foreground">All Requests</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoadingHistory}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                        {isLoadingHistory ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={isLoadingHistory || requestsHistory.length === 0} className="bg-accent text-accent-foreground hover:bg-accent/90 border-accent">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background/70 h-9 text-sm"/>
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs font-medium text-muted-foreground mb-1 block">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-background/70 h-9 text-sm"/>
              </div>
              <div>
                <Label htmlFor="adminUsernameQuery" className="text-xs font-medium text-muted-foreground mb-1 block">Admin Username</Label>
                <Input id="adminUsernameQuery" type="text" placeholder="e.g., admin_user" value={adminUsernameQuery} onChange={(e) => setAdminUsernameQuery(e.target.value)} className="bg-background/70 h-9 text-sm"/>
              </div>
              <div>
                <Label htmlFor="userSearchQuery" className="text-xs font-medium text-muted-foreground mb-1 block">User (Tag/Email)</Label>
                <Input id="userSearchQuery" type="text" placeholder="e.g., PlayerOne" value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="bg-background/70 h-9 text-sm"/>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
                <Button onClick={handleApplyFilters} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Search className="mr-2 h-4 w-4" /> Apply Filters
                </Button>
                <Button onClick={handleClearFilters} variant="outline" size="sm">
                    <FilterX className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-10 min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          )}
          {!isLoadingHistory && errorHistory && (
            <div className="flex flex-col items-center justify-center py-10 text-center min-h-[300px] px-5">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-semibold">Failed to Load History</p>
              <p className="text-sm text-muted-foreground">{errorHistory}</p>
              <Button onClick={fetchHistory} variant="outline" className="mt-4">Retry</Button>
            </div>
          )}
          {!isLoadingHistory && !errorHistory && requestsHistory.length === 0 && (
            <p className="text-center text-muted-foreground py-10 min-h-[300px] px-5">No top-up requests found matching your criteria.</p>
          )}
          {!isLoadingHistory && !errorHistory && requestsHistory.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-3 py-3">User</TableHead>
                    <TableHead className="hidden sm:table-cell px-3 py-3">Amount</TableHead>
                    <TableHead className="px-3 py-3">Status</TableHead>
                    <TableHead className="hidden md:table-cell px-3 py-3">Requested At</TableHead>
                    <TableHead className="hidden lg:table-cell px-3 py-3">Admin Notes</TableHead>
                    <TableHead className="text-center px-3 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsHistory.map((request) => {
                    const requestedAtIST = request.requestedAt 
                        ? new Date(request.requestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
                        : 'N/A';
                    return (
                    <TableRow key={request._id}>
                      <TableCell className="px-3 py-2">
                        <div className="font-medium text-foreground truncate max-w-[120px] sm:max-w-[150px]">{request.user?.gamerTag || 'N/A'}</div>
                        <div className="hidden sm:block text-xs text-muted-foreground truncate max-w-[150px]">{request.user?.email || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-medium px-3 py-2">₹{request.amount.toFixed(2)}</TableCell>
                       <TableCell className="px-3 py-2">
                        <Badge variant="outline" className={cn("capitalize text-xs font-normal whitespace-nowrap", getStatusBadgeVariant(request.status))}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm whitespace-nowrap px-3 py-2">{requestedAtIST}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground truncate max-w-[150px] px-3 py-2">{request.adminNotes || 'N/A'}</TableCell>
                      <TableCell className="text-center px-3 py-2">
                        {request.receiptData && request.receiptMimeType && (
                            <Button variant="outline" size="icon" onClick={() => handleViewReceipt(request)} className="h-7 w-7">
                                <Eye className="h-3.5 w-3.5"/>
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequestReceipt && (
        <div 
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedRequestReceipt(null)} 
        >
            <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden bg-card flex flex-col" onClick={(e) => e.stopPropagation()}>
                <CardHeader className="p-4 flex flex-row justify-between items-center border-b">
                    <CardTitle className="text-lg text-primary">Payment Receipt</CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedRequestReceipt(null)}
                    > <X className="h-5 w-5"/> </Button>
                </CardHeader>
                <CardContent className="p-2 flex-grow overflow-y-auto">
                    <div className="relative w-full min-h-[50vh] sm:min-h-[60vh] bg-muted/30 rounded">
                        <NextImage src={selectedRequestReceipt} alt="Receipt" layout="fill" objectFit="contain" data-ai-hint="receipt financial document" />
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
