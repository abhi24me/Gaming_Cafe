
'use client';

import type { TopUpRequestFromAPI } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Landmark, CheckCircle, XCircle, AlertTriangle, Loader2, Image as ImageIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image'; 

interface PendingRequestCardProps {
  request: TopUpRequestFromAPI;
  onActionSuccess: () => void; 
}

export default function PendingRequestCard({ request, onActionSuccess }: PendingRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [receiptDisplayUrl, setReceiptDisplayUrl] = useState<string>('https://placehold.co/300x200.png?text=Processing...');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    let url = 'https://placehold.co/300x200.png?text=Processing...';
    if (request.receiptData && request.receiptMimeType) {
      try {
        const buffer = Buffer.from((request.receiptData as any).data || request.receiptData);
        const base64String = buffer.toString('base64');
        url = `data:${request.receiptMimeType};base64,${base64String}`;
      } catch (e) {
        console.error("Error converting receiptData to base64:", e);
        url = 'https://placehold.co/300x200.png?text=Display+Error';
      }
    } else if (!request.receiptData) {
        url = 'https://placehold.co/300x200.png?text=No+Receipt';
    }
    setReceiptDisplayUrl(url);
  }, [request.receiptData, request.receiptMimeType]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await apiClient(`/admin/topup-requests/${request._id}/approve`, { method: 'PUT' });
      toast({ title: "Request Approved", description: `Request ID ${request._id.slice(-6)} approved.`, className: "bg-green-600 text-white border-green-700" });
      onActionSuccess(); 
    } catch (error) {
      toast({ title: "Approval Failed", description: error instanceof ApiError ? error.message : "Could not approve.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const adminNotes = prompt("Reason for rejection (optional):");
    if (adminNotes === null) return; 

    setIsProcessing(true);
    try {
      await apiClient(`/admin/topup-requests/${request._id}/reject`, { 
        method: 'PUT',
        body: JSON.stringify({ adminNotes: adminNotes || undefined }) 
      });
      toast({ title: "Request Rejected", description: `Request ID ${request._id.slice(-6)} rejected.`, className: "bg-red-600 text-white border-red-700" });
      onActionSuccess();
    } catch (error) {
      toast({ title: "Rejection Failed", description: error instanceof ApiError ? error.message : "Could not reject.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const requestedAtIST = request.requestedAt 
    ? new Date(request.requestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
    : 'N/A';

  return (
    <>
    <Card className="bg-card shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-base sm:text-lg text-primary flex items-center">
          <Landmark className="mr-2 h-5 w-5" />
          Top-Up: ₹{request.amount.toFixed(2)}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5 break-all">
          ID: {request._id}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4 text-muted-foreground" /> 
          <span className="font-medium truncate">{request.user?.gamerTag || 'N/A'}</span>
        </div>
        <div className="flex items-center">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="truncate">{request.user?.email || 'N/A'}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Requested: {requestedAtIST}
        </p>
        
        <div className="mt-3 pt-3 border-t">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Payment Receipt:</h4>
            {(receiptDisplayUrl.startsWith('data:') || receiptDisplayUrl.startsWith('http')) && !receiptDisplayUrl.includes('Processing...') ? (
                 <button onClick={() => setIsReceiptModalOpen(true)} className="block w-full h-40 sm:h-48 rounded border border-border overflow-hidden group bg-muted/20 relative">
                    <NextImage 
                        src={receiptDisplayUrl}
                        alt={`Receipt for request ${request._id}`}
                        layout="fill"
                        objectFit="contain"
                        className="group-hover:opacity-80 transition-opacity p-1"
                        data-ai-hint="payment receipt financial document"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="h-8 w-8 text-white" />
                    </div>
                </button>
            ) : (
                <div className="flex items-center justify-center h-40 sm:h-48 bg-muted/50 rounded border border-dashed text-muted-foreground p-2 text-center">
                    {receiptDisplayUrl.includes('Processing...') ? <Loader2 className="h-6 w-6 animate-spin"/> : <AlertTriangle className="h-6 w-6 mr-2"/>}
                    <p className="ml-2">{receiptDisplayUrl.includes('Processing...') ? 'Loading...' : 'Receipt not available'}</p>
                </div>
            )}
        </div>

      </CardContent>
      <CardFooter className="p-3 bg-muted/30 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button 
          onClick={handleApprove} 
          disabled={isProcessing} 
          className="flex-1 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
        >
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
          Approve
        </Button>
        <Button 
          onClick={handleReject} 
          disabled={isProcessing} 
          variant="destructive"
          className="flex-1 w-full sm:w-auto"
        >
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4" />}
          Reject
        </Button>
      </CardFooter>
    </Card>

    {isReceiptModalOpen && (
        <div 
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
            onClick={() => setIsReceiptModalOpen(false)} 
        >
            <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden bg-card flex flex-col" onClick={(e) => e.stopPropagation()}>
                <CardHeader className="p-4 flex flex-row justify-between items-center border-b">
                    <CardTitle className="text-lg text-primary">Payment Receipt</CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsReceiptModalOpen(false)}
                    > <XCircle className="h-5 w-5"/> </Button>
                </CardHeader>
                <CardContent className="p-2 flex-grow overflow-y-auto">
                    <div className="relative w-full min-h-[50vh] sm:min-h-[60vh] bg-muted/30 rounded">
                        <NextImage src={receiptDisplayUrl} alt="Receipt" layout="fill" objectFit="contain" data-ai-hint="receipt financial document" />
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </>
  );
}
