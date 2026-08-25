import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}