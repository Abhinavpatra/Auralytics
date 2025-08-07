'use client'
import { Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card } from '@/components/ui/card'

export function WaitingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-neo-primary border-4 border-black dark:border-white rotate-12 opacity-20" />
      <div className="absolute top-40 right-32 w-24 h-24 bg-neo-secondary border-4 border-black dark:border-white -rotate-12 opacity-20" />
      <div className="absolute bottom-32 left-32 w-28 h-28 bg-neo-accent border-4 border-black dark:border-white rotate-45 opacity-20" />
      <div className="absolute bottom-20 right-20 w-36 h-36 bg-neo-purple border-4 border-black dark:border-white -rotate-6 opacity-20" />
      
      <div className="relative z-10 text-center">
        <div className="flex justify-end w-full absolute top-0 right-0 p-8">
          <ThemeToggle />
        </div>
        <Card className="neobrutalist-card p-12 bg-white dark:bg-black max-w-2xl mx-auto bounce-in">
          <Sparkles className="h-24 w-24 text-neo-primary mx-auto mb-6 animate-pulse" />
          <h1 className="text-6xl md:text-8xl font-black mb-4 text-black dark:text-white">
            COMING SOON...
          </h1>
          <p className="text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-8">
            WE'RE POLISHING YOUR DIGITAL AURA EXPERIENCE!
          </p>
          <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
            STAY TUNED FOR THE OFFICIAL LAUNCH.
          </p>
        </Card>
      </div>
    </div>
  )
}
