
'use client';

import type { Screen } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Monitor, Tv2, Gamepad2 } from 'lucide-react'; // Default icons

interface ScreenSelectorProps {
  screens: Screen[];
  onScreenSelect: (screen: Screen) => void;
}

// Helper to assign a default icon based on screen name or index
const getScreenIcon = (screen: Screen, index: number) => {
  if (screen.icon) return screen.icon; // If icon is somehow provided (e.g. mapping after fetch)
  // Basic logic to assign default icons - can be expanded
  if (screen.name?.toLowerCase().includes("monitor") || screen.name?.toLowerCase().includes("screen 1")) return Monitor;
  if (screen.name?.toLowerCase().includes("tv") || screen.name?.toLowerCase().includes("console") || screen.name?.toLowerCase().includes("screen 2")) return Tv2;
  return Gamepad2; // Default fallback
};


export default function ScreenSelector({ screens, onScreenSelect }: ScreenSelectorProps) {
  if (!screens || screens.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground text-lg">No screens available at the moment.</p>
        <p className="text-sm text-muted-foreground">Please check back later or contact support.</p>
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
      {screens.map((screen, index) => {
        const IconComponent = getScreenIcon(screen, index);
        return (
          <Card key={screen._id} className="flex flex-col bg-card/80 backdrop-blur-sm border-glow-primary overflow-hidden group">
            <div className="block relative w-full h-36 sm:h-48 overflow-hidden rounded-t-md">
              <Image
                src={screen.imagePlaceholderUrl || 'https://placehold.co/600x400.png'}
                alt={screen.name || 'Gaming Screen'}
                layout="fill"
                objectFit="cover"
                data-ai-hint={screen.imageAiHint || 'gaming setup'}
                className="rounded-t-md" 
              />
            </div>
            <CardHeader className="flex-row items-center space-x-2 sm:space-x-3 pb-2 sm:pb-3 pt-3 sm:pt-4 px-3 sm:px-4">
              {IconComponent && <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              <CardTitle className="text-lg sm:text-2xl text-primary">{screen.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between p-3 sm:p-4 pt-0">
              <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm">
                {screen.description || `Experience immersive gaming on our state-of-the-art ${screen.name?.toLowerCase() || 'setup'}. Perfect for solo adventures or battling with friends.`}
              </p>
              <button
                onClick={() => onScreenSelect(screen)}
                className="glowbutton mt-auto w-full"
                aria-label={`Choose ${screen.name}`}
              >
                Choose {screen.name}
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
