import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AppProvider } from '@/context/AppContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MONSTER - Shopify Product Scraper',
  description: 'Scrape and upload products from Shopify stores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <ThemeProvider>
          <AppProvider>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 160px)' }}>
              {children}
            </main>
            <Footer />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

