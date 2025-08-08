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
userData?: {
username: string
tweetCount: number
profileImage: string
bio: string
location: string
website: string
joinDate: string
isVerified: boolean
}
}

export function Dashboard() {
const { data: session, status } = useSession()
const router = useRouter()
const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
const [loading, setLoading] = useState(false)
const [hasAnalyzed, setHasAnalyzed] = useState(false)

const storageKey = (uname: string) => `auralytics:analysis:${uname}`
const storageScoreKey = (uname: string) => `auralytics:score:${uname}`
const storageMetricsKey = (uname: string) => `auralytics:metrics:${uname}`

function saveAnalysisToStorage(uname: string, userId: string, analysis: AnalysisData) {
try {
  const payload = {
    savedAt: new Date().toISOString(),
    username: uname,
    userId,
    analysis,
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(storageKey(uname), JSON.stringify(payload))
    localStorage.setItem(storageScoreKey(uname), String(analysis.auraScore))
    localStorage.setItem(storageMetricsKey(uname), JSON.stringify(analysis.engagement))
  }
} catch (e) {
  console.error('Failed to save analysis to localStorage:', e)
}
}

function loadAnalysisFromStorage(uname: string): AnalysisData | null {
try {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(storageKey(uname))
  if (!raw) return null
  const parsed = JSON.parse(raw) as { analysis?: AnalysisData }
  return parsed?.analysis ?? null
} catch (e) {
  console.error('Failed to load analysis from localStorage:', e)
  return null
}
}

useEffect(() => {
if (status === 'unauthenticated') {
  router.push('/')
}
}, [status, router])

useEffect(() => {
if (status === 'authenticated') {
  const uname = (session?.user as any)?.username
  if (uname) {
    const saved = loadAnalysisFromStorage(uname)
    if (saved) {
      setAnalysisData(saved)
      setHasAnalyzed(true)
    }
  }
}
}, [status, session])

const runAnalysis = async () => {
const uname = (session.user as any)?.username
const userId =
  (session.user as any).id ||
  session.user.email ||
  (session.user as any).username

if (!uname || !userId) {
  console.error('Missing username or userId; cannot analyze.')
  return
}

// If user already has a saved analysis, load it and exit.
const existing = loadAnalysisFromStorage(uname)
if (existing) {
  setAnalysisData(existing)
  setHasAnalyzed(true)
  return
}

setLoading(true)
try {
  const response = await fetch('/api/analyze', {
    method: 'POST',
  })
  const data = await response.json()

  if (data && data.engagement) {
    setAnalysisData(data)
    setHasAnalyzed(true)
    saveAnalysisToStorage(uname, userId, data)
  } else {
    console.error('Analysis data incomplete:', data)
  }
} catch (error) {
  console.error('Analysis failed:', error)
} finally {
  setLoading(false)
}
}

const takeScreenshot = () => {
// This function will be used to capture a screenshot of the analysis results
// The actual implementation would use a library like html2canvas or similar
alert('Screenshot functionality will be implemented here. This will capture the analysis results.')
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

const userTweetCount = analysisData?.userData?.tweetCount || (session.user as any)?.tweetCount || 0
const isVerified = analysisData?.userData?.isVerified || (session.user as any)?.isVerified || false
const userTier = userTweetCount >= 3000 ? 'POWER USER' : 'STANDARD'

return (
<div className="min-h-screen bg-background text-foreground">
  {/* Background Pattern */}
  <div className="absolute inset-0 dots-pattern opacity-30" />
  
  <div className="relative z-10 container mx-auto px-4 py-8">
    {/* Header */}
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <div className="neobrutalist-card dark:neobrutalist-card p-4 bg-neo-primary">
          <h1 className="text-2xl font-black text-black dark:text-white">AURA DASHBOARD</h1>
        </div>
        <div className={`neobrutalist-badge ${userTier === 'POWER USER' ? 'bg-neo-secondary text-white' : 'bg-neo-accent text-white'}`}>
          {userTier}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="neobrutalist-card p-4 text-right bg-white dark:bg-black">
          <div className="font-black text-lg">{session.user?.name || 'DEMO USER'}</div>
          <div className="text-sm font-bold text-muted-foreground">@{(session.user as any)?.username || 'demo_user'}</div>
          {isVerified && (
            <div className="text-xs font-bold text-blue-600 mt-1">✓ VERIFIED</div>
          )}
        </div>
        <ThemeToggle />
        <Button
          onClick={takeScreenshot}
          className="neobrutalist-button-secondary"
          aria-label="Capture screenshot of analysis"
        >
          <Download className="h-4 w-4 mr-2" />
          CAPTURE SCREENSHOT
        </Button>
        <Button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="neobrutalist-button bg-red-600 text-white"
          aria-label="Sign out"
          title="Sign out"
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
          <h2 className=" flex justify-between text-4xl font-black mb-6 text-black">DISCOVER YOUR DIGITAL AURA</h2>
          <p className="text-lg ml-12 font-bold text-black mb-8 max-w-md">
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
    ) : analysisData ? (
      analysisData.engagement ? (
      <>
        {/* Analysis Type Notice */}
        {!isVerified && (
          <div className="neobrutalist-card mb-4 bg-yellow-100 border-4 border-yellow-500 p-4">
            <div className="flex items-center gap-2">
              <div className="text-yellow-800 font-bold">⚠️ DEMO ANALYSIS</div>
              <div className="text-yellow-700 text-sm">
                This is a demo analysis with realistic metrics based on your profile. 
                Get verified to unlock real AI-powered analysis of your tweets!
              </div>
            </div>
          </div>
        )}

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
              
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="neobrutalist-card bg-neo-secondary">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-white" />
              <div className="text-2xl font-black text-white">{analysisData.engagement?.avgLikes ?? 0}</div>
              <div className="text-sm font-bold text-white">AVG LIKES</div>
            </CardContent>
          </Card>
          
          <Card className="neobrutalist-card bg-neo-primary">
            <CardContent className="p-6 text-center">
              <Repeat2 className="h-8 w-8 mx-auto mb-2 text-black" />
              <div className="text-2xl font-black text-black">{analysisData.engagement?.avgRetweets ?? 0}</div>
              <div className="text-sm font-bold text-black">AVG RETWEETS</div>
            </CardContent>
          </Card>
          
          <Card className="neobrutalist-card bg-neo-accent">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-white" />
              <div className="text-2xl font-black text-white">{analysisData.engagement?.avgReplies ?? 0}</div>
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
      </>
    ) : (
      <div className="text-center py-16">
        <div className="neobrutalist-card p-12 bg-red-100 border-4 border-red-500 mb-8 inline-block">
          <div className="text-red-800 font-bold text-xl mb-4">⚠️ ANALYSIS ERROR</div>
          <div className="text-red-700 text-sm mb-6">
            The analysis data is incomplete. Please try analyzing again.
          </div>
          <Button
            onClick={runAnalysis}
            disabled={loading}
            className="neobrutalist-button text-lg px-8 py-4 bg-red-600 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                RE-ANALYZING...
              </>
            ) : (
              <>
                <Zap className="mr-3 h-5 w-5" />
                RETRY ANALYSIS
              </>
            )}
          </Button>
        </div>
      </div>
    )
    ) : null}
  </div>
</div>
)
}
