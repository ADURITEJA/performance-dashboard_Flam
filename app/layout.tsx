import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Performance Dashboard',
  description: 'High-performance data visualization dashboard built with Next.js',
  applicationName: 'Performance Dashboard',
  authors: [{ name: 'Your Name', url: 'https://yourwebsite.com' }],
  generator: 'Next.js',
  keywords: ['dashboard', 'performance', 'visualization', 'nextjs', 'react'],
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://performance-dashboard-flam.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Performance Dashboard',
    description: 'High-performance data visualization dashboard',
    siteName: 'Performance Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Performance Dashboard',
    description: 'High-performance data visualization dashboard',
    creator: '@yourtwitter',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Preload critical resources */}
        <link rel="preload" href="/_next/static/css/app/layout.css" as="style" />
        
        {/* Service Worker Registration */}
        <Script id="service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                  .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  })
                  .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                  });
              });
            }
          `}
        </Script>
      </head>
      <body className={`${inter.className} antialiased h-full`}>
        <div className="min-h-full">
          {children}
        </div>
        
        {/* Web Vitals */}
        <Script
          src="/_next/static/chunks/web-vitals.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
