import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF.AI',
  description: 'AI PDF Tool',
  generator: 'JK',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
