import type { Metadata } from 'next'
import { DM_Sans, Bricolage_Grotesque, Fraunces, Playfair_Display, DM_Serif_Display, Instrument_Serif, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
})

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
})

export const metadata: Metadata = {
  title: 'JobsNL - Find Your Dream Job in the Netherlands',
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
        <body className={`${dmSans.variable} ${bricolage.variable} ${fraunces.variable} ${playfair.variable} ${dmSerif.variable} ${instrumentSerif.variable} ${sourceSerif.variable} font-body`}>
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
