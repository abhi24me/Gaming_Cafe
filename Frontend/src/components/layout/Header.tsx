
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Wallet as WalletIcon, PlusCircle, ArrowUpCircle, ArrowDownCircle, ExternalLink, LogOut, UserCircle, Edit3, Award } from 'lucide-react'; // Added Award
import { useWallet } from '@/contexts/WalletContext';
import type { Transaction } from '@/lib/types';
import { NAV_ITEMS } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TopUpDialog from '@/components/wallet/TopUpDialog';
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import EditGamerTagDialog from '@/components/auth/EditGamerTagDialog';

export default function Header() {
  const { balance, transactions, loyaltyPoints } = useWallet(); // Added loyaltyPoints
  const { gamerTag, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [isEditGamerTagDialogOpen, setIsEditGamerTagDialogOpen] = useState(false);

  const recentTransactions = transactions.slice(0, 3);

  return (
    <>
      <header className="py-4 px-2 sm:px-4 md:px-8 bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto flex items-center">
          <div className="flex items-center">
            <Gamepad2 className="h-6 w-6 mr-1 sm:h-7 sm:w-7 sm:mr-2 text-primary" />
            <Link href="/" legacyBehavior passHref>
              <a className="text-xl sm:text-2xl font-bold text-primary tracking-wider hover:opacity-80 transition-opacity font-heading">
                Wello
              </a>
            </Link>
          </div>

          <nav className="ml-8 sm:ml-10 md:ml-12 flex items-center space-x-2 sm:space-x-2 md:space-x-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link href={item.href} key={item.name} passHref legacyBehavior>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 sm:px-3",
                      isActive && "text-primary bg-primary/10 font-semibold shadow-inner"
                    )}
                    asChild
                  >
                    <a>
                      <Icon className={cn("h-4 w-4", (item.name !== "Home" && !isActive) && "sm:mr-2")} />
                      <span className={cn("hidden", (item.name === "Home" && !isActive) ? "sm:hidden" : "sm:inline", isActive && "sm:inline")}>
                        {item.name}
                      </span>
                    </a>
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center space-x-2 sm:space-x-4 text-foreground">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-md bg-card border border-border shadow-sm hover:bg-card/90 h-auto border-glow-accent">
                  <WalletIcon className="h-5 w-5 text-accent" />
                  <span className="font-semibold text-xs sm:text-sm">₹{balance.toFixed(0)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 md:w-80 mr-2 sm:mr-4 bg-card border-glow-accent" align="end">
                <DropdownMenuLabel className="text-primary text-base">Wallet Overview</DropdownMenuLabel>
                <DropdownMenuItem className="focus:bg-card/50">
                  <div className="flex justify-between w-full items-center">
                    <span className="text-muted-foreground">Current Balance:</span>
                    <span className="font-semibold text-accent text-lg">₹{balance.toFixed(2)}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-card/50">
                  <div className="flex justify-between w-full items-center">
                    <span className="text-muted-foreground flex items-center"><Award className="mr-1.5 h-4 w-4 text-yellow-400" /> Loyalty Points:</span>
                    <span className="font-semibold text-yellow-400 text-lg">{loyaltyPoints}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsTopUpDialogOpen(true)} className="cursor-pointer focus:bg-primary/20">
                  <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                  <span>Top Up Wallet</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground">Recent Activity</DropdownMenuLabel>
                {recentTransactions.length > 0 ? (
                  <ScrollArea className="h-auto max-h-48">
                    {recentTransactions.map((txn: Transaction) => (
                      <DropdownMenuItem key={txn.id} className="focus:bg-card/50 text-xs flex justify-between items-center">
                        <div className="flex items-center">
                          {txn.type === 'top-up' ? (
                            <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2 shrink-0" />
                          )}
                          <div className="flex flex-col">
                            <span className="text-foreground truncate max-w-[150px]">{txn.description}</span>
                            <span className="text-muted-foreground/80">{new Date(txn.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={cn("font-medium", txn.amount > 0 ? "text-green-500" : "text-red-500")}>
                          {txn.amount > 0 ? `+₹${txn.amount.toFixed(0)}` : `-₹${Math.abs(txn.amount).toFixed(0)}`}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                ) : (
                  <DropdownMenuItem className="text-muted-foreground text-center focus:bg-card/50">No recent transactions.</DropdownMenuItem>
                )}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild className="cursor-pointer focus:bg-primary/20">
                    <Link href="/wallet">
                        <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                        <span>View All Transactions</span>
                    </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated && gamerTag && (
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-md bg-card border border-border shadow-sm hover:bg-card/90 h-auto border-glow-accent">
                      <UserCircle className="h-5 w-5 text-accent" />
                      <span className="font-semibold text-xs sm:text-sm hidden md:inline">{gamerTag}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mr-2 sm:mr-4 bg-card border-glow-accent" align="end">
                    <DropdownMenuLabel className="text-primary text-base flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" /> {gamerTag}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsEditGamerTagDialogOpen(true)} className="cursor-pointer focus:bg-accent/20">
                      <Edit3 className="mr-2 h-4 w-4 text-accent" />
                      <span>Edit Gamer Tag</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={logout} className="cursor-pointer focus:bg-destructive/20 text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {!isAuthenticated && (
                 <Link href="/login" passHref legacyBehavior>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10 hover:text-primary btn-glow-primary">
                    Login
                  </Button>
                </Link>
            )}
          </div>
        </div>
      </header>
      <TopUpDialog isOpen={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen} />
      {isAuthenticated && (
        <EditGamerTagDialog isOpen={isEditGamerTagDialogOpen} onOpenChange={setIsEditGamerTagDialogOpen} />
      )}
    </>
  );
}
