'use client'; // Required for Profile and other client components

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Profile from '@/components/Profile';
// No specific icons are being imported for now to keep it simple.

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-retro-background text-retro-text font-sans">
      {/* Header */}
      <header className='sticky top-0 flex h-16 items-center gap-4 border-b border-retro-text/20 bg-retro-background/80 backdrop-blur-sm px-4 md:px-6 justify-between z-50'>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <Image src='/icon.png' alt="DouDou Logo" width={36} height={36} />
          <span className="font-bold text-xl text-retro-headline">DouDou</span>
        </Link>
        <Profile />
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 lg:py-36 text-center bg-gradient-to-b from-retro-background to-orange-100"> {/* Subtle gradient */}
          <div className="container px-4 mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-retro-headline leading-tight">
              DouDou: Vote for Your Favorite Images!
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto text-retro-subheadline">
              Easily create image voting sessions, invite friends, and find out which images reign supreme. Perfect for fun competitions and quick decisions!
            </p>
            <Button asChild size="lg" className="px-8 py-3 text-lg font-semibold bg-retro-cta text-retro-cta-text hover:bg-retro-cta-hover transition-colors duration-300 rounded-md shadow-lg">
              <Link href="/sessions">Get Started Now</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-20 lg:py-24 bg-orange-50"> {/* Slightly different background for separation */}
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-retro-headline">
              Why You'll Love DouDou
            </h2>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12 text-left">
              <div className="feature-item p-6 bg-retro-card-bg rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300">
                {/* Optional: Icon placeholder - could use a simple SVG or character later */}
                {/* <div className="text-3xl mb-4 text-retro-cta">🎨</div> */}
                <h3 className="text-2xl font-semibold mb-3 text-retro-card-title">Effortless Session Setup</h3>
                <p className="text-retro-card-text leading-relaxed">Get your voting board running in minutes with our intuitive creation process.</p>
              </div>
              <div className="feature-item p-6 bg-retro-card-bg rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300">
                {/* <div className="text-3xl mb-4 text-retro-cta">🖼️</div> */}
                <h3 className="text-2xl font-semibold mb-3 text-retro-card-title">Simple Image Uploads</h3>
                <p className="text-retro-card-text leading-relaxed">Add images quickly from your device, ready for voting in seconds.</p>
              </div>
              <div className="feature-item p-6 bg-retro-card-bg rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300">
                {/* <div className="text-3xl mb-4 text-retro-cta">🗳️</div> */}
                <h3 className="text-2xl font-semibold mb-3 text-retro-card-title">Public Voting Fun</h3>
                <p className="text-retro-card-text leading-relaxed">Share a simple link and let anyone vote to help pick the winning image.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-retro-text/20 py-8 px-4 md:px-6 bg-retro-background/90">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-retro-subheadline">
          <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} DouDou. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/tos" className="hover:text-retro-headline transition-colors">
              Terms of Service
            </Link>
            <Link href="/policy" className="hover:text-retro-headline transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
