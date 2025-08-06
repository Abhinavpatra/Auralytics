import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeUserTweets } from '@/lib/gemini'
import { TwitterAPI } from '@/lib/twitter'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const username = (session.user as any).username
    
    if (!username) {
      return NextResponse.json({ error: 'Username not found' }, { status: 400 })
    }

    // Initialize Twitter API (you'll need a Bearer Token)
    if (!process.env.TWITTER_BEARER_TOKEN) {
      // For demo purposes, return mock data
      const mockAnalysis = generateMockAnalysis()
      return NextResponse.json(mockAnalysis)
    }

    const twitterAPI = new TwitterAPI(process.env.TWITTER_BEARER_TOKEN)
    
    // Get user data
    const user = await twitterAPI.getUserByUsername(username)
    
    // Get user tweets
    const maxTweets = parseInt(process.env.MAX_TWEETS_ANALYSIS || '100')
    const tweets = await twitterAPI.getUserTweets(user.id, maxTweets)
    
    if (tweets.length === 0) {
      return NextResponse.json({ error: 'No tweets found for analysis' }, { status: 400 })
    }

    // Analyze with Gemini AI
    const analysis = await analyzeUserTweets(tweets, username)
    
    // TODO: Store analysis in database
    
    return NextResponse.json(analysis)
    
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateMockAnalysis() {
  const score = Math.floor(Math.random() * 100)
  return {
    auraScore: score,
    tierName: getTierName(score),
    sentiment: {
      positive: Math.random() * 0.6 + 0.2,
      negative: Math.random() * 0.3,
      neutral: Math.random() * 0.4 + 0.1,
      dominant: 'positive' as const
    },
    personality: {
      traits: ['Creative', 'Analytical', 'Humorous'],
      dominantTrait: 'Creative',
      confidence: 0.85
    },
    topics: [
      { name: 'AI & Tech', frequency: 0.4, sentiment: 0.7 },
      { name: 'Personal Growth', frequency: 0.3, sentiment: 0.8 },
      { name: 'Humor', frequency: 0.2, sentiment: 0.9 },
      { name: 'Current Events', frequency: 0.1, sentiment: 0.1 }
    ],
    engagement: {
      avgLikes: Math.floor(Math.random() * 100 + 20),
      avgRetweets: Math.floor(Math.random() * 50 + 5),
      avgReplies: Math.floor(Math.random() * 30 + 3),
      totalEngagement: 1250,
      engagementRate: 0.045
    },
    writingStyle: {
      tone: 'casual',
      formality: 0.3,
      emotiveness: 0.7,
      clarity: 0.8
    },
    timePatterns: {
      mostActiveHour: 14,
      mostActiveDay: 'Tuesday',
      postingFrequency: 2.3
    },
    viralPotential: {
      score: Math.floor(Math.random() * 100),
      factors: ['High engagement rate', 'Trending topics', 'Authentic voice']
    },
    summary: 'A creative and engaging digital presence with strong community interaction and authentic voice.',
    timeSeriesData: generateTimeSeriesData()
  }
}

function getTierName(score: number): string {
  if (score >= 96) return 'Aura God'
  if (score >= 91) return 'Amrit Sir'
  if (score >= 81) return 'Aura Farmer'
  if (score >= 61) return 'Occasional Legend'
  if (score >= 41) return 'Aura Farmer'
  if (score >= 21) return 'Upcoming Sage'
  return 'Noob'
}

function generateTimeSeriesData() {
  const data = []
  const now = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      sentiment: Math.random() * 100,
      engagement: Math.random() * 100,
      auraScore: Math.random() * 100,
    })
  }
  
  return data
}
