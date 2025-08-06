'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ThemeToggle } from '@/components/theme-toggle'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { Twitter, Share2, Download, Zap, TrendingUp, Users, MessageCircle, Heart, Repeat2, LogOut, Sparkles, BarChart3, Target } from 'lucide-react'

interface AnalysisData {
  auraScore: number
  tierName: string
  sentiment: {
    positive: number
    negative: number
    neutral: number
    dominant: 'positive' | 'negative' | 'neutral'
  }
  personality: {
    traits: string[]
    dominantTrait: string
    confidence: number
  }
  topics: Array<{
    name: string
    frequency: number
    sentiment: number
  }>
  engagement: {
    avgLikes: number
    avgRetweets: number
    avgReplies: number
    totalEngagement: number
    engagementRate: number
  }
  writingStyle: {
    tone: string
    formality: number
    emotiveness: number
    clarity: number
  }
  timePatterns: {
    mostActiveHour: number
    mostActiveDay: string
    postingFrequency: number
  }
  viralPotential: {
    score: number
    factors: string[]
  }
  summary: string
  timeSeriesData: Array<{
    date: string
    sentiment: number
    engagement: number
    auraScore: number
  }>
}

export function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="neobrutalist-card p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-black dark:border-white border-t-transparent mx-auto"></div>
          <p className="text-center mt-4 font-bold">LOADING DASHBOARD...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
      })
      const data = await response.json()
      setAnalysisData(data)
      setHasAnalyzed(true)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const shareAuraCard = () => {
    if (!analysisData) return
    
    const tweetText = `Just unlocked my digital aura 🌈 — scored a ${analysisData.auraScore} (${analysisData.tierName}) on @AuraCardAI. What's yours?`
    const shareUrl = `${window.location.origin}/share/example-card-id`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`
    
    window.open(twitterUrl, '_blank')
  }

  const downloadCard = () => {
    const link = document.createElement('a')
    link.href = '/api/og/example-card-id'
    link.download = 'aura-card.png'
    link.click()
  }

  const getTierColor = (score: number) => {
    if (score >= 96) return 'bg-neo-purple text-white'
    if (score >= 91) return 'bg-neo-secondary text-white'
    if (score >= 81) return 'bg-orange-500 text-white'
    if (score >= 61) return 'bg-neo-warning text-black'
    if (score >= 41) return 'bg-neo-primary text-black'
    if (score >= 21) return 'bg-neo-accent text-white'
    return 'bg-gray-400 text-black'
  }

  const userFollowers = (session.user as any)?.followers || 0
  const userTier = userFollowers >= 3000 ? 'POWER USER' : 'STANDARD'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Pattern */}
      <div className="absolute inset-0 dots-pattern opacity-30" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="neobrutalist-card p-4 bg-neo-primary">
              <h1 className="text-2xl font-black text-black">AURA DASHBOARD</h1>
            </div>
            <div className={`neobrutalist-badge ${userTier === 'POWER USER' ? 'bg-neo-secondary text-white' : 'bg-neo-accent text-white'}`}>
              {userTier}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="neobrutalist-card p-4 text-right bg-white dark:bg-black">
              <div className="font-black text-lg">{session.user?.name || 'DEMO USER'}</div>
              <div className="text-sm font-bold text-muted-foreground">@{(session.user as any)?.username || 'demo_user'}</div>
              <div className="text-xs font-bold text-muted-foreground">{userFollowers} FOLLOWERS</div>
            </div>
            <ThemeToggle />
            <Button
              onClick={() => signOut()}
              className="neobrutalist-button-secondary"
            >
              <LogOut className="h-4 w-4 mr-2" />
              SIGN OUT
            </Button>
          </div>
        </div>

        {!hasAnalyzed ? (
          /* Analysis CTA */
          <div className="text-center py-16">
            <div className="neobrutalist-card p-12 bg-gradient-to-br from-neo-primary to-neo-accent mb-8 inline-block">
              <Sparkles className="h-20 w-20 text-black mx-auto mb-6" />
              <h2 className="text-4xl font-black mb-6 text-black">DISCOVER YOUR DIGITAL AURA</h2>
              <p className="text-lg font-bold text-black mb-8 max-w-md">
                LET OUR AI ANALYZE YOUR X POSTS TO GENERATE YOUR UNIQUE AURA SCORE AND INSIGHTS
              </p>
              <Button
                onClick={runAnalysis}
                disabled={loading}
                className="neobrutalist-button text-xl px-12 py-6 bg-black text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <Zap className="mr-3 h-6 w-6" />
                    ANALYZE MY AURA
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : analysisData && (
          <>
            {/* Aura Score Card */}
            <Card className="neobrutalist-card mb-8 bg-gradient-to-r from-neo-primary to-neo-secondary neon-pulse">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div className="text-center">
                    <div className="text-7xl font-black text-black mb-2 font-mono">
                      {analysisData.auraScore}
                    </div>
                    <div className="text-sm font-bold text-black">AURA SCORE</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`neobrutalist-badge text-2xl font-black mb-4 ${getTierColor(analysisData.auraScore)} px-6 py-3`}>
                      {analysisData.tierName}
                    </div>
                    <div className="neobrutalist-progress bg-white h-6">
                      <Progress 
                        value={analysisData.auraScore} 
                        className="h-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={shareAuraCard}
                      className="neobrutalist-button flex-1 bg-neo-accent text-white"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      SHARE
                    </Button>
                    <Button
                      onClick={downloadCard}
                      className="neobrutalist-button flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      DOWNLOAD
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="neobrutalist-card bg-neo-secondary">
                <CardContent className="p-6 text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-white" />
                  <div className="text-2xl font-black text-white">{analysisData.engagement.avgLikes}</div>
                  <div className="text-sm font-bold text-white">AVG LIKES</div>
                </CardContent>
              </Card>
              
              <Card className="neobrutalist-card bg-neo-primary">
                <CardContent className="p-6 text-center">
                  <Repeat2 className="h-8 w-8 mx-auto mb-2 text-black" />
                  <div className="text-2xl font-black text-black">{analysisData.engagement.avgRetweets}</div>
                  <div className="text-sm font-bold text-black">AVG RETWEETS</div>
                </CardContent>
              </Card>
              
              <Card className="neobrutalist-card bg-neo-accent">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-white" />
                  <div className="text-2xl font-black text-white">{analysisData.engagement.avgReplies}</div>
                  <div className="text-sm font-bold text-white">AVG REPLIES</div>
                </CardContent>
              </Card>
              
              <Card className="neobrutalist-card bg-neo-purple">
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-white" />
                  <div className="text-2xl font-black text-white">{analysisData.viralPotential.score}</div>
                  <div className="text-sm font-bold text-white">VIRAL SCORE</div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="neobrutalist-card bg-white dark:bg-black p-2">
                <TabsTrigger value="overview" className="neobrutalist-button data-[state=active]:bg-neo-primary data-[state=active]:text-black">
                  OVERVIEW
                </TabsTrigger>
                <TabsTrigger value="sentiment" className="neobrutalist-button data-[state=active]:bg-neo-secondary data-[state=active]:text-white">
                  SENTIMENT
                </TabsTrigger>
                <TabsTrigger value="topics" className="neobrutalist-button data-[state=active]:bg-neo-accent data-[state=active]:text-white">
                  TOPICS
                </TabsTrigger>
                <TabsTrigger value="engagement" className="neobrutalist-button data-[state=active]:bg-neo-purple data-[state=active]:text-white">
                  ENGAGEMENT
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="neobrutalist-card bg-white dark:bg-black">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black flex items-center">
                      <BarChart3 className="mr-3 h-6 w-6" />
                      AURA SCORE TIMELINE
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analysisData.timeSeriesData}>
                        <defs>
                          <linearGradient id="auraGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(var(--neo-primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="rgb(var(--neo-primary))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="currentColor"
                          tick={{ fontSize: 12, fontWeight: 'bold' }}
                        />
                        <YAxis stroke="currentColor" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgb(var(--background))', 
                            border: '4px solid rgb(var(--foreground))',
                            borderRadius: '0px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="auraScore"
                          stroke="rgb(var(--neo-primary))"
                          strokeWidth={4}
                          fill="url(#auraGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sentiment" className="space-y-6">
                <Card className="neobrutalist-card bg-white dark:bg-black">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">SENTIMENT BREAKDOWN</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6 mb-8">
                      <div>
                        <div className="flex justify-between mb-3">
                          <span className="font-black text-neo-primary">POSITIVE</span>
                          <span className="font-bold">{(analysisData.sentiment.positive * 100).toFixed(1)}%</span>
                        </div>
                        <div className="neobrutalist-progress bg-gray-200 h-6">
                          <Progress value={analysisData.sentiment.positive * 100} className="h-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-3">
                          <span className="font-black text-gray-600">NEUTRAL</span>
                          <span className="font-bold">{(analysisData.sentiment.neutral * 100).toFixed(1)}%</span>
                        </div>
                        <div className="neobrutalist-progress bg-gray-200 h-6">
                          <Progress value={analysisData.sentiment.neutral * 100} className="h-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-3">
                          <span className="font-black text-neo-secondary">NEGATIVE</span>
                          <span className="font-bold">{(analysisData.sentiment.negative * 100).toFixed(1)}%</span>
                        </div>
                        <div className="neobrutalist-progress bg-gray-200 h-6">
                          <Progress value={analysisData.sentiment.negative * 100} className="h-full" />
                        </div>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analysisData.timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} />
                        <XAxis dataKey="date" stroke="currentColor" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                        <YAxis stroke="currentColor" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgb(var(--background))', 
                            border: '4px solid rgb(var(--foreground))',
                            borderRadius: '0px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sentiment"
                          stroke="rgb(var(--neo-secondary))"
                          strokeWidth={4}
                          dot={{ fill: 'rgb(var(--neo-secondary))', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="topics" className="space-y-6">
                <Card className="neobrutalist-card bg-white dark:bg-black">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">TOPIC DISTRIBUTION</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analysisData.topics} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} />
                        <XAxis type="number" stroke="currentColor" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                        <YAxis dataKey="name" type="category" stroke="currentColor" tick={{ fontSize: 12, fontWeight: 'bold' }} width={120} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgb(var(--background))', 
                            border: '4px solid rgb(var(--foreground))',
                            borderRadius: '0px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Bar dataKey="frequency" fill="rgb(var(--neo-accent))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-6">
                <Card className="neobrutalist-card bg-white dark:bg-black">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">ENGAGEMENT TRENDS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analysisData.timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} />
                        <XAxis dataKey="date" stroke="currentColor" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                        <YAxis stroke="currentColor" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgb(var(--background))', 
                            border: '4px solid rgb(var(--foreground))',
                            borderRadius: '0px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="engagement"
                          stroke="rgb(var(--neo-purple))"
                          strokeWidth={4}
                          dot={{ fill: 'rgb(var(--neo-purple))', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Re-analyze Button */}
            <div className="text-center pt-8">
              <Button
                onClick={runAnalysis}
                disabled={loading}
                className="neobrutalist-button-primary text-lg px-8 py-4"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent mr-3" />
                    RE-ANALYZING...
                  </>
                ) : (
                  <>
                    <Zap className="mr-3 h-5 w-5" />
                    RE-ANALYZE AURA
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
