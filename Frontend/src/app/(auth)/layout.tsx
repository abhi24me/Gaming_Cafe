
import { Gamepad2 } from 'lucide-react';
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
              Wello
            </a>
          </Link>
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border">
        © {new Date().getFullYear()} Wello. All rights reserved.
      </footer>
    </div>
  );
}
