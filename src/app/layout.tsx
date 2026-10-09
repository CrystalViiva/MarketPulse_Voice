import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'MarketPulse Voice — Your business, in your words',
  description: 'Private voice-assisted bookkeeping for Nigerian merchants.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>{children}</body>
    </html>
  );
}
