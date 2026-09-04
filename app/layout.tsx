import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://prooflens-agent.yaowenhu1215.chatgpt.site'),
  title: 'ProofLens · Evidence infrastructure for research agents',
  description: 'A claim-level evidence verification and human-handoff layer for research agents.',
  openGraph: {
    title: 'ProofLens · Evidence infrastructure for research agents',
    description: 'A claim-level evidence verification and human-handoff layer for research agents.',
    type: 'website',
    url: 'https://prooflens-agent.yaowenhu1215.chatgpt.site',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'ProofLens evidence infrastructure for research agents' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProofLens · Evidence infrastructure for research agents',
    description: 'A claim-level evidence verification and human-handoff layer for research agents.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
