'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Twitter, Zap, TrendingUp, Share2, BarChart3, Sparkles, Users, Target } from 'lucide-react'

export function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="neobrutalist-card p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-black dark:border-white border-t-transparent mx-auto"></div>
          <p className="text-center mt-4 font-bold">LOADING...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-neo-primary border-4 border-black dark:border-white rotate-12 opacity-20" />
      <div className="absolute top-40 right-32 w-24 h-24 bg-neo-secondary border-4 border-black dark:border-white -rotate-12 opacity-20" />
      <div className="absolute bottom-32 left-32 w-28 h-28 bg-neo-accent border-4 border-black dark:border-white rotate-45 opacity-20" />
      <div className="absolute bottom-20 right-20 w-36 h-36 bg-neo-purple border-4 border-black dark:border-white -rotate-6 opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="neobrutalist-card p-4 bg-neo-primary">
            <h1 className="text-2xl font-black text-black">AURA CARD AI</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="bounce-in">
            <div className="inline-block neobrutalist-card p-8 mb-8 bg-white dark:bg-black">
              <h1 className="text-6xl md:text-8xl font-black mb-4">
                <span className="text-neo-primary">QUANTIFY</span>
                <br />
                <span className="text-neo-secondary">YOUR</span>
                <br />
                <span className="text-neo-accent">DIGITAL</span>
                <br />
                <span className="text-neo-purple">AURA</span>
              </h1>
            </div>
          </div>
          
          <div className="neobrutalist-card p-6 mb-8 bg-neo-warning max-w-3xl mx-auto">
            <p className="text-xl md:text-2xl font-bold text-black">
              AI-POWERED SOCIAL MEDIA ANALYSIS THAT GENERATES YOUR UNIQUE AURA SCORE 
              AND SHAREABLE DIGITAL PERSONA CARDS
            </p>
          </div>
          
          <Button
            onClick={() => signIn('twitter')}
            className="neobrutalist-button-primary text-xl px-12 py-6"
          >
            <Twitter className="mr-3 h-6 w-6" />
            CONNECT X ACCOUNT
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {[
            {
              icon: Zap,
              title: 'AURA SCORE',
              description: 'GET A 0-100 SCORE THAT CAPTURES YOUR DIGITAL VIBE',
              bgColor: 'bg-neo-warning',
              textColor: 'text-black'
            },
            {
              icon: BarChart3,
              title: 'DEEP ANALYTICS',
              description: 'TRACK SENTIMENT, TOPICS, AND ENGAGEMENT OVER TIME',
              bgColor: 'bg-neo-accent',
              textColor: 'text-white'
            },
            {
              icon: TrendingUp,
              title: 'TREND ANALYSIS',
              description: 'SEE HOW YOUR DIGITAL PERSONA EVOLVES',
              bgColor: 'bg-neo-purple',
              textColor: 'text-white'
            },
            {
              icon: Share2,
              title: 'SHAREABLE CARDS',
              description: 'GENERATE VIRAL AURA CARDS TO SHARE YOUR SCORE',
              bgColor: 'bg-neo-secondary',
              textColor: 'text-white'
            }
          ].map((feature, index) => (
            <Card key={index} className={`neobrutalist-card p-6 ${feature.bgColor} hover:scale-105 transition-transform duration-300`}>
              <feature.icon className={`h-12 w-12 mb-4 ${feature.textColor}`} />
              <h3 className={`text-lg font-black mb-3 ${feature.textColor}`}>{feature.title}</h3>
              <p className={`font-bold text-sm ${feature.textColor}`}>{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Tier System */}
        <div className="text-center mb-20">
          <div className="neobrutalist-card p-6 mb-8 bg-neo-primary inline-block">
            <h2 className="text-4xl font-black text-black">AURA TIER SYSTEM</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { range: '0-20', name: 'NOOB', bgColor: 'bg-gray-400', textColor: 'text-black' },
              { range: '21-40', name: 'UPCOMING SAGE', bgColor: 'bg-neo-accent', textColor: 'text-white' },
              { range: '41-60', name: 'AURA FARMER', bgColor: 'bg-neo-primary', textColor: 'text-black' },
              { range: '61-80', name: 'OCCASIONAL LEGEND', bgColor: 'bg-neo-warning', textColor: 'text-black' },
              { range: '81-90', name: 'AURA FARMER', bgColor: 'bg-orange-500', textColor: 'text-white' },
              { range: '91-95', name: 'AMRIT SIR', bgColor: 'bg-neo-secondary', textColor: 'text-white' },
              { range: '96-100', name: 'AURA GOD', bgColor: 'bg-neo-purple', textColor: 'text-white' },
            ].map((tier, index) => (
              <Card key={index} className={`neobrutalist-card p-4 ${tier.bgColor} text-center hover:scale-110 transition-transform duration-300`}>
                <div className={`text-lg font-black ${tier.textColor}`}>{tier.range}</div>
                <div className={`text-xs font-bold ${tier.textColor} mt-1`}>{tier.name}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: Users, number: '10K+', label: 'USERS ANALYZED', bgColor: 'bg-neo-primary' },
            { icon: Sparkles, number: '50K+', label: 'AURA CARDS GENERATED', bgColor: 'bg-neo-secondary' },
            { icon: Target, number: '95%', label: 'ACCURACY RATE', bgColor: 'bg-neo-accent' }
          ].map((stat, index) => (
            <div key={index} className={`neobrutalist-card p-8 ${stat.bgColor} text-center`}>
              <stat.icon className="h-12 w-12 mx-auto mb-4 text-black" />
              <div className="text-4xl font-black text-black mb-2">{stat.number}</div>
              <div className="text-sm font-bold text-black">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="neobrutalist-card p-12 bg-gradient-to-r from-neo-primary to-neo-secondary">
            <h3 className="text-3xl md:text-4xl font-black mb-6 text-black">
              READY TO DISCOVER YOUR DIGITAL AURA?
            </h3>
            <p className="text-lg font-bold text-black mb-8 max-w-2xl mx-auto">
              JOIN THOUSANDS OF USERS WHO HAVE ALREADY UNLOCKED THEIR DIGITAL PERSONA INSIGHTS
            </p>
            <Button
              onClick={() => signIn('twitter')}
              className="neobrutalist-button text-xl px-12 py-6 bg-black text-white hover:bg-gray-800"
            >
              <Twitter className="mr-3 h-6 w-6" />
              GET STARTED NOW
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
