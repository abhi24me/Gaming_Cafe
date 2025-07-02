
import Header from '@/components/layout/Header';
import { WalletProvider } from '@/contexts/WalletContext';
import { MapPin, Phone } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('Rendering AppLayout (app routes)');
  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow container mx-auto py-4 sm:py-6 md:py-8">
          {children}
        </main>
        <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border">
          <div>© {new Date().getFullYear()} Tron. All rights reserved.</div>
          <div className="flex justify-center items-center space-x-6 mt-4">
            <a href="https://maps.app.goo.gl/Cy94pPNHEoKBN5DY8" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
              <MapPin className="h-4 w-4 mr-2" />
              <span>Location</span>
            </a>
            <a href="https://wa.me/+918840112865" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
              <Phone className="h-4 w-4 mr-2" />
              <span>WhatsApp</span>
            </a>
          </div>
          <div className="mt-6 text-xs text-muted-foreground/70 px-4">
            Disclaimer: Lorem ipsum dolor, sit amet consectetur adipisicing elit. Iusto corrupti ut alias unde eaque fugiat velit blanditiis vel odio asperiores, voluptatem molestias, totam sapiente ducimus quas dolores hic cum! Repellat! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Iusto corrupti ut alias unde eaque fugiat velit blanditiis vel odio asperiores, voluptatem molestias, totam sapiente ducimus quas dolores hic cum! Repellat! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Iusto corrupti ut alias unde eaque fugiat velit blanditiis vel odio asperiores, voluptatem molestias, totam sapiente ducimus quas dolores hic cum! Repellat!
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
