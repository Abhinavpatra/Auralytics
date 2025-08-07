import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'Auralytics - Quantify Your Digital Journey',
  description: 'Social media analysis that generates your unique Aura Score and shareable digital persona cards.',
  keywords: ['social media', 'AI analysis', 'digital persona', 'aura score', 'twitter analysis'],
  authors: [{ name: 'Abhinav Patra' }],
  openGraph: {
    title: 'Auralytics - Quantify Your Digital Journey',
    description: 'Discover your digital aura with AI-powered social media analysis',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auralytics',
    description: 'Quantify your digital history with AI',
    images: ['/og-image.png'],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
