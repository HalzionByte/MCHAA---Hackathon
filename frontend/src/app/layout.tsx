import "./globals.css";

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <meta name="theme-color" content="#0B0F17" />
      </head>
      <body className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-[var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}