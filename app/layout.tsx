import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MAI Bets V3',
  description: 'Sports betting signal system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-800 min-h-screen`}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 bg-slate-50 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
