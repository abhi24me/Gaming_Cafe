
'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, IndianRupee, History, AlertTriangle, Clock, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import TopUpDialog from '@/components/wallet/TopUpDialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DisplayTransaction extends Transaction {
  formattedDate: string | null;
}

const ITEMS_PER_PAGE = 5;

export default function WalletTransactions() {
  const { balance, transactions, fetchWalletData } = useWallet(); 
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [clientFormattedTransactions, setClientFormattedTransactions] = useState<DisplayTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setClientFormattedTransactions(
      transactions.map(txn => ({
        ...txn,
        formattedDate: txn.timestamp ? new Date(txn.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : 'Date N/A'
      }))
    );
    setCurrentPage(1); // Reset to first page on new data
  }, [transactions]);
  
  const handleDialogClose = (open: boolean) => {
    setIsTopUpDialogOpen(open);
    if (!open) {
      fetchWalletData(); 
    }
  };

  const totalPages = Math.ceil(clientFormattedTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = clientFormattedTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };


  const getTransactionIcon = (txn: DisplayTransaction) => {
    if (txn.type === 'topup-request') {
      if (txn.status === 'pending') return <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500 mr-2 sm:mr-3 shrink-0" />;
      if (txn.status === 'rejected') return <Ban className="h-4 w-4 sm:h-6 sm:w-6 text-red-500 mr-2 sm:mr-3 shrink-0" />;
    }
    // Approved top-up requests that became actual 'top-up' transactions get ArrowUpCircle
    if (txn.type === 'top-up') return <ArrowUpCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-500 mr-2 sm:mr-3 shrink-0" />;
    if (txn.type === 'booking-fee') return <ArrowDownCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-500 mr-2 sm:mr-3 shrink-0" />;
    return <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground mr-2 sm:mr-3 shrink-0" />; 
  };

  const getStatusBadge = (txn: DisplayTransaction) => {
    if (txn.type === 'topup-request' && txn.status) {
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      let textAndBorderClass = "";
      if (txn.status === 'pending') { 
        variant = "secondary"; 
        textAndBorderClass = "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50";
      } else if (txn.status === 'rejected') { 
        variant = "destructive"; 
        textAndBorderClass = "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50";
      }
      return <Badge variant={variant} className={cn("capitalize text-xs ml-2 px-1.5 py-0.5", textAndBorderClass)}>{txn.status}</Badge>;
    }
     if (txn.type === 'top-up' && txn.status === 'approved') { 
      return <Badge variant="default" className="capitalize text-xs ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/50">Approved</Badge>;
    }
    return null;
  };


  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm border-glow-accent max-w-2xl mx-auto flex flex-col max-h-[85vh]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6 pb-2 sm:pb-4 shrink-0">
          <div>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">Current Balance</CardDescription>
            <CardTitle className="text-2xl sm:text-4xl text-accent font-bold flex items-center">
              <IndianRupee className="h-5 w-5 sm:h-7 sm:w-7 mr-1" />
              {balance.toFixed(2)}
            </CardTitle>
          </div>
          <Button onClick={() => setIsTopUpDialogOpen(true)} className="btn-glow-primary btn-gradient-primary-accent text-xs sm:text-base px-3 py-1.5 sm:px-4 sm:py-2">
            <PlusCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-5 sm:w-5" />
            Top Up Wallet
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow overflow-hidden p-3 sm:p-4 pt-2 sm:pt-4">
          <div className="flex items-center mb-2 sm:mb-4 text-sm sm:text-lg text-primary font-semibold shrink-0">
            <History className="mr-1 sm:mr-2 h-4 w-4 sm:h-6 sm:w-6" />
            Transaction History ({clientFormattedTransactions.length})
          </div>
          {clientFormattedTransactions.length > 0 ? (
            <>
              <ScrollArea className="flex-grow pr-2 sm:pr-3">
                <div className="space-y-2 sm:space-y-3">
                  {paginatedTransactions.map((txn: DisplayTransaction) => (
                    <div
                      key={txn._id} 
                      className="flex items-center justify-between p-2 sm:p-3 bg-background/40 rounded-lg border border-border/70 shadow-sm hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center flex-1 min-w-0"> 
                        {getTransactionIcon(txn)}
                        <div className="flex-1 min-w-0"> 
                          <div className="flex items-center">
                              <p className="font-medium text-foreground text-xs sm:text-base truncate">{txn.description}</p>
                              {getStatusBadge(txn)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {txn.formattedDate || 'Loading date...'}
                          </p>
                           {txn.type === 'topup-request' && txn.status === 'rejected' && txn.adminNotes && (
                             <p className="text-xs text-destructive mt-0.5">Note: {txn.adminNotes}</p>
                           )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm sm:text-lg font-semibold ml-2 whitespace-nowrap",
                          txn.type === 'booking-fee' ? "text-red-500" :
                          (txn.type === 'topup-request' && txn.status === 'rejected') ? "text-red-500 line-through" : 
                          (txn.type === 'topup-request' && txn.status === 'pending') ? "text-yellow-600 dark:text-yellow-400" :
                          "text-green-500" 
                        )}
                      >
                        {txn.type !== 'booking-fee' && txn.amount >= 0 ? `+₹${txn.amount.toFixed(2)}` :
                         txn.type === 'booking-fee' ? `-₹${Math.abs(txn.amount).toFixed(2)}` :
                         `₹${txn.amount.toFixed(2)}`} 
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {totalPages > 1 && (
                <div className="flex items-center justify-center pt-4 border-t border-border/70 shrink-0 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground mx-4 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground text-sm sm:text-lg py-8 sm:py-10">No transactions yet. Make a booking or top up your wallet!</p>
          )}
        </CardContent>
      </Card>
      <TopUpDialog isOpen={isTopUpDialogOpen} onOpenChange={handleDialogClose} />
    </>
  );
}
