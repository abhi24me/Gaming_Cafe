
import Header from '@/components/layout/Header';
import { WalletProvider } from '@/contexts/WalletContext';

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
          © {new Date().getFullYear()} Wello. All rights reserved.
        </footer>
      </div>
    </WalletProvider>
  );
}
