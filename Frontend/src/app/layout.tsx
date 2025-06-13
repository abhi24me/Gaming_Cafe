
import type { Metadata } from 'next';
import { orbitron, roboto } from '@/lib/fonts';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'Wello - PS5 Gaming Café',
  description: 'Book your PS5 gaming sessions at Wello!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${roboto.variable} antialiased`} suppressHydrationWarning={true}>
        <AuthProvider> {/* Wrap children with AuthProvider */}
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
