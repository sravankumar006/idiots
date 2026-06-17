import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import PwaHandler from "@/components/layout/PwaHandler";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://idiots.space'),
  title: {
    default: 'idiots space — your private space',
    template: '%s · idiots space',
  },
  description: 'A warm, private digital home for you and your crew. chat, share, hang out.',
  keywords: ['messaging', 'private chat', 'friends', 'realtime', 'idiots space'],
  authors: [{ name: 'idiots space' }],
  creator: 'idiots space',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://idiots.space',
    siteName: 'idiots space',
    title: 'idiots space — your private space',
    description: 'A warm, private digital home for you and your crew. chat, share, hang out.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'idiots space — your private space',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'idiots space — your private space',
    description: 'A warm, private digital home for you and your crew. chat, share, hang out.',
    images: ['/og-image.png'],
    creator: '@idiotsspace',
  },

  robots: {
    index: false, // Private app — no public indexing
    follow: false,
    googleBot: { index: false, follow: false },
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'idiots space',
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport = {
  themeColor: '#090a10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PwaHandler />
        </ThemeProvider>
      </body>
    </html>
  );
}
