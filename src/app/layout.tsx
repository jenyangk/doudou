import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Rubik, Work_Sans } from 'next/font/google'

const rubik = Rubik({ subsets: ['latin'], display: 'swap', variable: '--font-rubik' })
const workSans = Work_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-work-sans' })

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
    <html lang="en">
      <body
        className={`${workSans.variable} font-sans ${rubik.variable} antialiased`}
      >
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
