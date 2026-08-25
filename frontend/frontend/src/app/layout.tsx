import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full bg-[var(--bg-main)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}