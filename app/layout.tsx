import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TunerAI — ECU Datalog Analysis',
  description: 'AI-powered ECU datalog analysis for high-performance tuning shops. © 2026 Tovar Euro LLC.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
