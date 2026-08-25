import type { Metadata } from 'next';
import { Manrope, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { RootProvider } from 'fumadocs-ui/provider';
import 'fumadocs-ui/style.css';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Send by Uplift',
  description: 'Email infrastructure for every app under the Uplift umbrella.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <RootProvider theme={{ defaultTheme: 'light', enableSystem: false }}>{children}</RootProvider>
      </body>
    </html>
  );
}
