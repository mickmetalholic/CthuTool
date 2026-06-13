import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CthuTool Web',
  description: 'Browser host scaffold for the CthuTool management console.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
