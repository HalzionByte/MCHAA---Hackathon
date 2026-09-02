import "./globals.css";
import { Inter } from 'next/font/google';
import { LanguageProvider } from '../context/LanguageContext';
import HtmlWrapper from '../components/HtmlWrapper';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <HtmlWrapper>{children}</HtmlWrapper>
    </LanguageProvider>
  );
}
