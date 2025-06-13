
'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, IndianRupee, History } from 'lucide-react';
import TopUpDialog from '@/components/wallet/TopUpDialog';
import { cn } from '@/lib/utils';

interface DisplayTransaction extends Transaction {
  formattedDate: string | null;
}

export default function WalletTransactions() {
  const { balance, transactions } = useWallet();
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [clientFormattedTransactions, setClientFormattedTransactions] = useState<DisplayTransaction[]>([]);

  useEffect(() => {
    const sorted = [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setClientFormattedTransactions(
      sorted.map(txn => ({
        ...txn,
        formattedDate: new Date(txn.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      }))
    );
  }, [transactions]);

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
          <Button onClick={() => setIsTopUpDialogOpen(true)} className="btn-glow-primary btn-gradient-primary-accent text-xs sm:text-base px-3 py-1.5 sm:px-4 sm:py-2"> {/* Changed to primary-accent gradient */}
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
            <ScrollArea className="flex-grow pr-2 sm:pr-3">
              <div className="space-y-2 sm:space-y-3">
                {clientFormattedTransactions.map((txn: DisplayTransaction) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-background/40 rounded-lg border border-border/70 shadow-sm hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center">
                      {txn.type === 'top-up' ? (
                        <ArrowUpCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-500 mr-2 sm:mr-3 shrink-0" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-500 mr-2 sm:mr-3 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-foreground text-xs sm:text-base">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {txn.formattedDate || 'Loading date...'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-sm sm:text-lg font-semibold",
                        txn.amount > 0 ? "text-green-500" : "text-red-500" // Consider using secondary for positive amounts
                      )}
                    >
                      {txn.amount > 0 ? `+₹${txn.amount.toFixed(2)}` : `-₹${Math.abs(txn.amount).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground text-sm sm:text-lg py-8 sm:py-10">No transactions yet. Make a booking or top up your wallet!</p>
          )}
        </CardContent>
      </Card>
      <TopUpDialog isOpen={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen} />
    </>
  );
}
