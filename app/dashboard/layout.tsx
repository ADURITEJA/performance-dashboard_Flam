import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Performance Dashboard',
  description: 'A high-performance dashboard with real-time data visualization',
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50 p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
