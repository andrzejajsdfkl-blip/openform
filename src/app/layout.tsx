import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StorageProvider } from '@/lib/storage';
import { Toaster } from '@/components/ui/toaster';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: {
    template: '%s | OpenForm Studio',
    default: 'OpenForm Studio - Architectural Document Engine',
  },
  description: 'Enterprise-grade semantic document management and architectural filing system',
  keywords: ['documents', 'architecture', 'filing', 'records', 'management'],
  authors: [{ name: 'OpenForm' }],
  generator: 'Next.js',
  applicationName: 'OpenForm Studio',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OpenForm Studio',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <meta name="color-scheme" content="dark" />
        <meta name="description" content="Enterprise-grade semantic document management" />
      </head>
      <body className="font-body antialiased bg-background text-foreground transition-colors duration-300">
        <StorageProvider>
          {children}
          <Toaster />
        </StorageProvider>
      </body>
    </html>
  );
}
