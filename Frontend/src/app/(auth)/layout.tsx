
import { Gamepad2, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="flex items-center mb-8">
          <Gamepad2 className="h-10 w-10 mr-3 text-primary" />
          <Link href="/" legacyBehavior passHref>
            <a className="text-4xl font-bold text-primary tracking-wider hover:opacity-80 transition-opacity">
              Tron
            </a>
          </Link>
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border">
        <div>© {new Date().getFullYear()} Tron. All rights reserved.</div>
        <div className="flex justify-center items-center space-x-6 mt-4">
          <a href="https://maps.app.goo.gl/Cy94pPNHEoKBN5DY8" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
            <MapPin className="h-4 w-4 mr-2" />
            <span>Location</span>
          </a>
          <a href="https://wa.me/8840112865" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
            <Phone className="h-4 w-4 mr-2" />
            <span>WhatsApp</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
