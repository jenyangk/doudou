import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Rubik } from 'next/font/google'

const rubik = Rubik({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: "DouDou",
  description: "Image Vote Board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${rubik.className} $antialiased`}
        >
          {children}
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
