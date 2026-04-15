import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ClientHtmlLang from '../components/ClientHtmlLang'
import { TranslationProvider } from '../contexts/TranslationContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Signal Lab',
  description: 'Curated AI & Design news from 40+ sources',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <TranslationProvider>
          <ClientHtmlLang />
          <Header />
          <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            {children}
          </main>
          <Footer />
        </TranslationProvider>
      </body>
    </html>
  )
}
