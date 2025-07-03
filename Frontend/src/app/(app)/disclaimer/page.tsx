'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DisclaimerPage() {
  const router = useRouter();

  const handleAcknowledge = () => {
    router.push('/'); // Redirect to the main application.
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12">
      <Card className="w-full max-w-3xl bg-card/80 backdrop-blur-sm border-glow-accent">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-2xl sm:text-3xl text-primary">
            Disclaimer: Property Damage Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-foreground/90 px-4 sm:px-8 pb-6">
          <p className="text-base sm:text-lg">
            At Tron, we strive to provide a top-quality gaming environment for everyone. To maintain our equipment and facilities, we have a strict policy regarding property damage.
          </p>
          <p className="font-semibold text-lg sm:text-xl p-4 bg-background/50 border border-destructive/50 rounded-lg text-destructive">
            Any damage caused to Tron&apos;s property, including but not limited to PS5 consoles, controllers, monitors, headsets, furniture, or any other equipment, will be assessed and charged to the user responsible for the damage.
          </p>
          <p className="text-sm text-muted-foreground">
            This includes accidental damage. Please handle all equipment with care. By using our services, you agree to this policy.
          </p>
          <div className="pt-4">
             <Button 
                onClick={handleAcknowledge} 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
              >
                I Understand, Return Home
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
