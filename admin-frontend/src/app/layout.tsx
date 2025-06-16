
import type { Metadata } from 'next';
import './globals.css'; // Ensure this import is present and correct
import { Toaster } from "@/components/ui/toaster";
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';

export const metadata: Metadata = {
  title: 'Wello Admin Panel',
  description: 'Manage WelloSphere operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"> {/* No specific "light" class needed if :root IS the light theme in globals.css */}
      <body>
        <AdminAuthProvider>
          {children}
          <Toaster />
        </AdminAuthProvider>
      </body>
    </html>
  );
}
