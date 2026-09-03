import "./globals.css";
import { Inter, Noto_Nastaliq_Urdu } from 'next/font/google';
import { LanguageProvider } from '../context/LanguageContext';
import LanguageSync from '../components/LanguageSync';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const notoUrdu = Noto_Nastaliq_Urdu({ subsets: ['arabic'], variable: '--font-noto', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${notoUrdu.variable}`}>
      <head>
        <meta name="theme-color" content="#0B0F17" />
      </head>
      <body className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-[family-name:var(--font-inter)]">
        <LanguageProvider>
          <LanguageSync />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
