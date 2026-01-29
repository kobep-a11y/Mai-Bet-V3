import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'MAI Bets V3 - Sky Tech Sports Intelligence',
  description: 'Cutting-edge sports betting signal system with AI-powered strategy detection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.className} min-h-screen`} style={{ background: '#F8FAFB' }}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
