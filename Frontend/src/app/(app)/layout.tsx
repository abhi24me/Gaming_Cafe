
import Header from '@/components/layout/Header';
import { WalletProvider } from '@/contexts/WalletContext';
import { MapPin, Phone, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

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
          <div className="flex justify-center items-center space-x-4 sm:space-x-6 mt-4">
            <a href="https://maps.app.goo.gl/Cy94pPNHEoKBN5DY8" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
              <MapPin className="h-4 w-4 mr-2" />
              <span>Location</span>
            </a>
            <a href="https://wa.me/+918579049036" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
              <Phone className="h-4 w-4 mr-2" />
              <span>WhatsApp</span>
            </a>
            <Link href="/disclaimer" legacyBehavior>
              <a className="flex items-center hover:text-primary transition-colors">
                <ShieldAlert className="h-4 w-4 mr-2" />
                <span>Disclaimer</span>
              </a>
            </Link>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
