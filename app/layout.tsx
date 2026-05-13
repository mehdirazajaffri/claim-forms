import type { Metadata } from 'next'
import { IBM_Plex_Sans, Manrope, Roboto, Space_Grotesk } from 'next/font/google'
import Link from 'next/link'
import Providers from './providers'
import AuthNav from '@/components/AuthNav'
import './globals.css'

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
})

const sectionFont = Manrope({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-section',
})

const dataFont = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-data',
})

export const metadata: Metadata = {
  title: 'Dr. Ramsha Claims Management',
  description: 'Healthcare claim form submission system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${sectionFont.variable} ${dataFont.variable}`}>
        <Providers>
          <div className="app-shell">
            <header className="app-header">
              <div className="app-header__inner">
                <Link href="/" className="app-brand" aria-label="Go to dashboard">
                  <span className="app-brand__eyebrow">Dr. Ramsha</span>
                  <span className="app-brand__title">Claims Workspace</span>
                </Link>

                <nav className="app-nav" aria-label="Primary">
                  <Link href="/" className="app-nav__link">
                    Dashboard
                  </Link>
                  <Link href="/claims/new" className="app-nav__link app-nav__link--strong">
                    New Claim
                  </Link>
                  <AuthNav />
                </nav>
              </div>
            </header>

            <main className="app-main">
              <div className="app-main__inner">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
