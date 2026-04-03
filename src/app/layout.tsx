import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Draw Manager - Southern Cities Construction',
  description: 'Manage construction draw requests and lender draws',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f8f9fc] min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
