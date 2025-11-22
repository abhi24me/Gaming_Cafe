
import type { Metadata } from 'next';
import { orbitron, roboto } from '@/lib/fonts';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'Tron - PS5 Gaming Café',
  description: 'Book your PS5 gaming sessions at Tron!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7538706253819455"
          crossOrigin="anonymous"></script>
      </head>
      <body className={`${orbitron.variable} ${roboto.variable} antialiased`} suppressHydrationWarning={true}>
        <AuthProvider> {/* Wrap children with AuthProvider */}
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
