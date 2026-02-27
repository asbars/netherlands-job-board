import type { Metadata } from 'next'
import { DM_Sans, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'Netherlands Job Opportunities - Find Your Dream Job',
  description: 'Find your dream job in the Netherlands with advanced filtering and notification. Daily updates with the latest opportunities for expats.',
  keywords: 'jobs, netherlands, expats, career, employment, work permit, job opportunities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${dmSans.variable} ${dmSans.className} ${bricolage.variable}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
