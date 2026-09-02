import "./globals.css";
import { Inter } from 'next/font/google';
import { LanguageProvider } from '../context/LanguageContext';
import LanguageSync from '../components/LanguageSync';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="font-inter antialiased">
      <head>
        <meta name="theme-color" content="#0B0F17" />
      </head>
      <body className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-[var(--font-inter)]">
        <LanguageProvider>
          <LanguageSync />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
