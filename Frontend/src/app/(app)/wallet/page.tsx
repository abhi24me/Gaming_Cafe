
'use client';

import WalletTransactions from '@/components/wallet/WalletTransactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Mail, BellDot } from 'lucide-react';

export default function WalletPage() {
  const [promoOptIn, setPromoOptIn] = useState(true);

  return (
    <div className="space-y-8">
        <div className="text-center mb-8 pt-4">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary text-transparent bg-clip-text mb-2 inline-block">Your Wallet</h2>
            <p className="text-base sm:text-lg text-muted-foreground">Manage your funds and view transaction history.</p>
        </div>
        <WalletTransactions />

        <Separator className="my-8 sm:my-10 bg-border/50" />

        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6 text-primary flex items-center justify-center">
            <BellDot className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Notification Preferences
          </h3>
          <Card className="bg-card/80 backdrop-blur-sm border-glow-accent">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl text-accent">Promotional Offers</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-foreground/80">
                Stay updated with the latest events, discounts, and special offers at Wello.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3">
              <div className="flex items-center justify-between space-x-2 bg-background/40 p-3 sm:p-4 rounded-lg border border-border/70">
                <Label htmlFor="promo-opt-in" className="flex flex-col space-y-1 cursor-pointer">
                  <span className="font-medium text-sm sm:text-base text-foreground/90">Receive Promotional Offers</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs sm:text-sm">
                    Get notified about new game releases, tournaments, and exclusive deals.
                  </span>
                </Label>
                <Switch
                  id="promo-opt-in"
                  checked={promoOptIn}
                  onCheckedChange={setPromoOptIn}
                  aria-label="Toggle promotional offers"
                />
              </div>
              {promoOptIn && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-background/30 rounded-lg border border-dashed border-border/50 text-center">
                  <Mail className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Your promotional messages and special offers will appear here!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (This is a mock display area for future promotions)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
