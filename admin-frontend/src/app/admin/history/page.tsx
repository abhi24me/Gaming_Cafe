
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History as HistoryIcon, Loader2, AlertTriangle, RefreshCw, Eye, Download, FilterX, Search, X } from 'lucide-react';
import type { TopUpRequestFromAPI } from '@/lib/types';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';

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
    // fetchHistory will be called by the useEffect dependency change if we clear states that are part of its deps
    // Or call it explicitly if the state setters don't trigger it immediately (e.g., batched updates)
    // For simplicity and explicitness:
    setRequestsHistory([]); // Clear current view
    fetchHistory(); // Re-fetch with empty filters
  };


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
    let bufferInput: number[] | undefined;

    if (request.receiptData && request.receiptMimeType) {
      // Try common structure first: { type: 'Buffer', data: [...] }
      if (typeof request.receiptData === 'object' && 'data' in request.receiptData && Array.isArray((request.receiptData as any).data)) {
        bufferInput = (request.receiptData as any).data;
      } 
      // Else, check if receiptData itself is an array of numbers (another way Buffers might get serialized from aggregation)
      else if (Array.isArray(request.receiptData)) {
        // Basic check to see if it looks like byte data
        if (request.receiptData.every(item => typeof item === 'number' && item >= 0 && item <= 255)) {
            bufferInput = request.receiptData as number[];
        }
      }

      if (bufferInput) {
        try {
          const buffer = Buffer.from(bufferInput);
          const base64String = buffer.toString('base64');
          setSelectedRequestReceipt(`data:${request.receiptMimeType};base64,${base64String}`);
        } catch (e) {
          console.error("Error converting receipt buffer:", e);
          toast({ title: "Receipt Display Error", description: "Could not display receipt due to a conversion error.", variant: "destructive"});
          setSelectedRequestReceipt(null);
        }
      } else {
         toast({ title: "Receipt Data Error", description: "Receipt data is not in an expected format.", variant: "destructive"});
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
      "Request ID", "User GamerTag", "User Email", "Amount (₹)", "Requested At", "Status",
      "Reviewed By", "Reviewed At", "Admin Notes"
    ];

    const csvRows = requestsHistory.map(request => {
      const requestedAt = new Date(request.requestedAt).toLocaleString();
      const reviewedAt = request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : 'N/A';
      const adminNotes = request.adminNotes ? `"${request.adminNotes.replace(/"/g, '""')}"` : 'N/A';

      return [
        request._id,
        request.user?.gamerTag || 'N/A',
        request.user?.email || 'N/A',
        request.amount.toFixed(2),
        requestedAt,
        request.status,
        request.reviewedBy?.username || 'N/A',
        reviewedAt,
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


  if (isLoadingAdminAuth || (!isAdminAuthenticated && !isLoadingAdminAuth && pathname !== '/admin/login')) {
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
          View and filter submitted top-up requests.
        </p>
      </div>

      <Card className="shadow-lg border-border bg-card">
        <CardHeader className="p-4 sm:p-5 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center">
                    <HistoryIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary mr-2 sm:mr-3" />
                    <CardTitle className="text-lg sm:text-xl text-primary-foreground">All Requests</CardTitle>
                </div>
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full xs:w-auto">
                    <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoadingHistory} className="h-9">
                        <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                        <span className="ml-2 hidden xs:inline">{isLoadingHistory ? 'Refreshing...' : 'Refresh'}</span>
                         <span className="xs:hidden ml-2">Refresh</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={isLoadingHistory || requestsHistory.length === 0} className="h-9 bg-accent text-accent-foreground hover:bg-accent/90 border-accent">
                        <Download className="h-4 w-4" />
                        <span className="ml-2 hidden xs:inline">Report</span>
                        <span className="xs:hidden ml-2">Report</span>
                    </Button>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-sm bg-background/70"/>
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-sm bg-background/70"/>
              </div>
              <div>
                <Label htmlFor="adminUsernameQuery" className="text-xs text-muted-foreground">Admin Username</Label>
                <Input id="adminUsernameQuery" type="text" placeholder="e.g., admin_user" value={adminUsernameQuery} onChange={(e) => setAdminUsernameQuery(e.target.value)} className="h-9 text-sm bg-background/70"/>
              </div>
              <div>
                <Label htmlFor="userSearchQuery" className="text-xs text-muted-foreground">User (GamerTag/Email)</Label>
                <Input id="userSearchQuery" type="text" placeholder="e.g., PlayerOne" value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="h-9 text-sm bg-background/70"/>
              </div>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Button onClick={handleApplyFilters} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 flex-1 sm:flex-auto">
                    <Search className="h-4 w-4 mr-0 sm:mr-2" />
                    <span className="hidden sm:inline">Apply Filters</span>
                    <span className="sm:hidden">Filter</span>
                </Button>
                <Button onClick={handleClearFilters} variant="outline" size="sm" className="h-9 flex-1 sm:flex-auto">
                    <FilterX className="h-4 w-4 mr-0 sm:mr-2" />
                    <span className="hidden sm:inline">Clear Filters</span>
                    <span className="sm:hidden">Clear</span>
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-10 min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          )}
          {!isLoadingHistory && errorHistory && (
            <div className="flex flex-col items-center justify-center py-10 text-center min-h-[200px] px-4">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-semibold">Failed to Load History</p>
              <p className="text-sm text-muted-foreground">{errorHistory}</p>
              <Button onClick={fetchHistory} variant="outline" className="mt-4">Retry</Button>
            </div>
          )}
          {!isLoadingHistory && !errorHistory && requestsHistory.length === 0 && (
            <p className="text-center text-muted-foreground py-10 min-h-[200px] px-4">No top-up requests found matching your criteria.</p>
          )}
          {!isLoadingHistory && !errorHistory && requestsHistory.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] sm:min-w-[180px]">User</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead className="min-w-[150px]">Requested At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[120px]">Reviewed By</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[150px]">Reviewed At</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[150px]">Admin Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsHistory.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="font-medium text-foreground truncate max-w-[150px] sm:max-w-none">{request.user?.gamerTag || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">{request.user?.email || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="font-medium">₹{request.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(request.requestedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize text-xs font-normal whitespace-nowrap", getStatusBadgeVariant(request.status))}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell truncate max-w-[120px]">{request.reviewedBy?.username || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>
                        {request.receiptData && request.receiptMimeType ? (
                            <Button variant="outline" size="sm" onClick={() => handleViewReceipt(request)} className="h-7 px-2 py-1 text-xs">
                                <Eye className="h-3.5 w-3.5"/>
                            </Button>
                        ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground truncate max-w-[150px]">{request.adminNotes || 'N/A'}</TableCell>
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
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2 sm:p-4"
            onClick={() => setSelectedRequestReceipt(null)}
        >
            <Card className="w-full max-w-xs sm:max-w-md md:max-w-lg max-h-[90vh] overflow-hidden bg-card flex flex-col" onClick={(e) => e.stopPropagation()}>
                <CardHeader className="p-3 flex flex-row justify-between items-center border-b">
                    <CardTitle className="text-base sm:text-lg text-primary">Payment Receipt</CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedRequestReceipt(null)}
                    > <X className="h-4 w-4 sm:h-5 sm:w-5"/> </Button>
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
    

    

