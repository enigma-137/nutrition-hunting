import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nutrition Hunter',
  description: 'Learn about balanced diet through gaming',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 font-sans">{children}</body>
    </html>
  );
}