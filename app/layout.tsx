import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "First Time Chess - Learn Chess Online",
  description: "A beginner-friendly chess learning platform with interactive lessons and multiplayer games",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/images/first-time-chess-logo-app.svg",
        type: "image/svg+xml",
        sizes: "32x32",
      },
      {
        url: "/images/first-time-chess-logo-app.svg",
        type: "image/svg+xml",
        sizes: "16x16",
      },
      {
        url: "/images/first-time-chess-logo-app.svg",
        type: "image/svg+xml",
        sizes: "48x48",
      },
    ],
    shortcut: "/favicon.svg",
    apple: "/images/first-time-chess-logo-app.svg",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={GeistSans.className}>{children}</body>
    </html>
  )
}
