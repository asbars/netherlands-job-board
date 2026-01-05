import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Netherlands Job Board - Jobs for Expats',
  description: 'Find jobs in the Netherlands from verified company career sites. Daily updates with the latest opportunities for expats.',
  keywords: 'jobs, netherlands, expats, career, employment, work permit',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

