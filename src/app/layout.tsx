import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'FixMyCity — One City. One Platform. Every Service.',
  description:
    'A unified modern civic services web application for reporting municipal issues, tracking resolutions, and transparent city services.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#176B68',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased flex flex-col">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: '10px',
              fontFamily: 'inherit',
            },
          }}
        />
      </body>
    </html>
  );
}
