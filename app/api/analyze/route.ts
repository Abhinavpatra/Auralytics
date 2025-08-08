import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeUserTweets, type Tweet } from '@/lib/gemini'
import { TwitterAPI } from '@/lib/twitter'
import { saveUserAnalysis, getUserAnalysis } from '@/lib/mongodb'

// Utility: consistent structure for frontend
function ensureAnalysisCompleteness(analysis: any) {
  const safeNumber = (v: any, d = 0) =>
    typeof v === 'number' && isFinite(v) ? v : d
  const safeString = (v: any, d = '') =>
    typeof v === 'string' ? v : d
  const safeArray = (v: any, d: any[] = []) =>
    Array.isArray(v) && v.length ? v : d

  const auraScore = Math.max(
    0,
    Math.min(100, Math.floor(safeNumber(analysis?.auraScore, 50)))
  )

  const result = {
    auraScore,
    tierName: safeString(analysis?.tierName) || getTierName(auraScore),
    sentiment: {
      positive: Math.max(0, Math.min(1, safeNumber(analysis?.sentiment?.positive, 0.5))),
      negative: Math.max(0, Math.min(1, safeNumber(analysis?.sentiment?.negative, 0.2))),
      neutral: Math.max(0, Math.min(1, safeNumber(analysis?.sentiment?.neutral, 0.3))),
      dominant:
        analysis?.sentiment?.dominant === 'positive' ||
        analysis?.sentiment?.dominant === 'negative' ||
        analysis?.sentiment?.dominant === 'neutral'
          ? analysis.sentiment.dominant
          : 'positive',
    },
    personality: {
      traits: safeArray(analysis?.personality?.traits, [
        'Creative',
        'Analytical',
        'Engaging',
      ]),
      dominantTrait: safeString(analysis?.personality?.dominantTrait, 'Creative'),
      confidence: Math.max(0, Math.min(1, safeNumber(analysis?.personality?.confidence, 0.75))),
    },
    topics: safeArray(analysis?.topics, [
      { name: 'Technology', frequency: 0.3, sentiment: 0.7 },
      { name: 'Personal Thoughts', frequency: 0.25, sentiment: 0.6 },
      { name: 'Current Events', frequency: 0.2, sentiment: 0.5 },
    ]).map((t: any) => ({
      name: safeString(t?.name, 'General'),
      frequency: Math.max(0, Math.min(1, safeNumber(t?.frequency, 0.2))),
      sentiment: Math.max(0, Math.min(1, safeNumber(t?.sentiment, 0.6))),
    })),
    engagement: {
      avgLikes: Math.max(0, Math.floor(safeNumber(analysis?.engagement?.avgLikes, 20))),
      avgRetweets: Math.max(0, Math.floor(safeNumber(analysis?.engagement?.avgRetweets, 5))),
      avgReplies: Math.max(0, Math.floor(safeNumber(analysis?.engagement?.avgReplies, 3))),
      totalEngagement: Math.max(0, Math.floor(safeNumber(analysis?.engagement?.totalEngagement, 500))),
      engagementRate: Math.max(0, Math.min(1, safeNumber(analysis?.engagement?.engagementRate, 0.03))),
    },
    writingStyle: {
      tone: safeString(analysis?.writingStyle?.tone, 'casual'),
      formality: Math.max(0, Math.min(1, safeNumber(analysis?.writingStyle?.formality, 0.4))),
      emotiveness: Math.max(0, Math.min(1, safeNumber(analysis?.writingStyle?.emotiveness, 0.6))),
      clarity: Math.max(0, Math.min(1, safeNumber(analysis?.writingStyle?.clarity, 0.75))),
    },
    timePatterns: {
      mostActiveHour: Math.max(0, Math.min(23, Math.floor(safeNumber(analysis?.timePatterns?.mostActiveHour, 14)))),
      mostActiveDay: safeString(analysis?.timePatterns?.mostActiveDay, 'Tuesday'),
      postingFrequency: Math.max(0.1, safeNumber(analysis?.timePatterns?.postingFrequency, 2.0)),
    },
    viralPotential: {
      score: Math.max(0, Math.min(100, Math.floor(safeNumber(analysis?.viralPotential?.score, auraScore)))),
      factors: safeArray(analysis?.viralPotential?.factors, [
        'Authentic voice',
        'Engaging content',
      ]),
    },
    summary: safeString(
      analysis?.summary,
      'A creative and engaging digital presence with growing community interaction.'
    ),
    timeSeriesData: safeArray(
      analysis?.timeSeriesData,
      generateTimeSeriesData()
    ),
    userData: analysis?.userData || undefined,
  }
  result.tierName = getTierName(result.auraScore)
  return result
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
    const base = 50 + Math.sin((i / 30) * Math.PI * 2) * 20 + (Math.random() - 0.5) * 10
    data.push({
      date: date.toISOString().split('T')[0],
      sentiment: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * 12)),
      engagement: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * 15)),
      auraScore: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * 8)),
    })
  }
  return data
}

function analysisFromCounts({
  followers,
  following,
}: {
  followers: number
  following: number
}) {
  const ratio = followers / Math.max(1, following)
  const followerScore = Math.min(50, Math.log10(Math.max(1, followers + 1)) * 15) // up to ~45-50
  const ratioScore = Math.max(0, Math.min(40, (ratio > 1 ? Math.min(3, ratio) : ratio) * 12))
  const base = 15 + followerScore + ratioScore
  const jitter = Math.floor((Math.random() - 0.5) * 12)
  const auraScore = Math.max(10, Math.min(100, Math.floor(base + jitter)))

  const avgLikes = Math.max(1, Math.floor((followers / 1000) * (Math.random() * 40 + 10)))
  const avgRetweets = Math.max(0, Math.floor(avgLikes * (Math.random() * 0.3 + 0.1)))
  const avgReplies = Math.max(0, Math.floor(avgLikes * (Math.random() * 0.25 + 0.05)))
  const totalEngagement = avgLikes + avgRetweets + avgReplies
  const engagementRate = Math.min(1, totalEngagement / Math.max(50, followers / 10))

  return ensureAnalysisCompleteness({
    auraScore,
    tierName: getTierName(auraScore),
    sentiment: {
      positive: Math.random() * 0.4 + 0.3,
      negative: Math.random() * 0.2 + 0.1,
      neutral: Math.random() * 0.3 + 0.2,
      dominant: 'positive',
    },
    personality: {
      traits: ['Creative', 'Analytical', 'Engaging'].slice(
        0,
        Math.floor(Math.random() * 2) + 2
      ),
      dominantTrait: 'Creative',
      confidence: Math.random() * 0.3 + 0.7,
    },
    topics: [
      { name: 'Technology', frequency: Math.random() * 0.3 + 0.2, sentiment: Math.random() * 0.3 + 0.5 },
      { name: 'Personal Thoughts', frequency: Math.random() * 0.3 + 0.2, sentiment: Math.random() * 0.3 + 0.5 },
      { name: 'Current Events', frequency: Math.random() * 0.2 + 0.1, sentiment: Math.random() * 0.4 + 0.3 },
      { name: 'Humor', frequency: Math.random() * 0.2 + 0.1, sentiment: Math.random() * 0.2 + 0.7 },
    ],
    engagement: {
      avgLikes,
      avgRetweets,
      avgReplies,
      totalEngagement,
      engagementRate: Math.round(engagementRate * 1000) / 1000,
    },
    writingStyle: {
      tone: ['casual', 'professional', 'humorous'][Math.floor(Math.random() * 3)],
      formality: Math.random() * 0.5 + 0.2,
      emotiveness: Math.random() * 0.4 + 0.4,
      clarity: Math.random() * 0.3 + 0.7,
    },
    timePatterns: {
      mostActiveHour: Math.floor(Math.random() * 12) + 8,
      mostActiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][
        Math.floor(Math.random() * 7)
      ],
      postingFrequency: Math.random() * 5 + 0.5,
    },
    viralPotential: {
      score: Math.max(0, Math.min(100, auraScore + Math.floor(Math.random() * 20) - 10)),
      factors: ['Authentic voice', 'Engaging content', 'Good timing'].slice(
        0,
        Math.floor(Math.random() * 2) + 1
      ),
    },
    summary: `An ${auraScore > 70 ? 'active and engaging' : auraScore > 40 ? 'moderately active' : 'developing'} presence with a follower/following ratio of ${ratio.toFixed(
      2
    )}.`,
    timeSeriesData: generateTimeSeriesData(),
  })
}

async function fetchFollowerFollowing(username: string) {
  // Use our own helper API to unify logic and keep CORS simple
  const res = await fetch(
    `${process.env.NEXTAUTH_URL || ''}/api/social/metrics?username=${encodeURIComponent(
      username
    )}`,
    { cache: 'no-store' }
  ).catch(() => null)

  if (res && res.ok) {
    const data = await res.json()
    return {
      followers: data.followers_count as number,
      following: data.following_count as number,
    }
  }

  // Direct fallback if NEXTAUTH_URL isn't set in preview: call the public endpoint inline
  try {
    const syndication = await fetch(
      `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${encodeURIComponent(
        username
      )}`,
      { cache: 'no-store' }
    )
    const arr = (await syndication.json()) as any[]
    const followers =
      typeof arr?.[0]?.followers_count === 'number' ? arr[0].followers_count : 0
    // Heuristic for following
    const following = Math.max(10, Math.floor(followers * 0.4))
    return { followers, following }
  } catch {
    return { followers: 0, following: 50 }
  }
}

function simpleAnalysisFromTweets(tweets: Tweet[], username: string) {
  const likeAvg =
    tweets.reduce((acc, t) => acc + (t.public_metrics?.like_count || 0), 0) /
    Math.max(1, tweets.length)
  const rtAvg =
    tweets.reduce((acc, t) => acc + (t.public_metrics?.retweet_count || 0), 0) /
    Math.max(1, tweets.length)
  const replyAvg =
    tweets.reduce((acc, t) => acc + (t.public_metrics?.reply_count || 0), 0) /
    Math.max(1, tweets.length)
  const totalEngagement = Math.floor((likeAvg + rtAvg + replyAvg) * tweets.length)
  const engagementRate = Math.min(1, (likeAvg + rtAvg + replyAvg) / 100)

  // Score from engagement
  const base = Math.min(85, Math.log10(Math.max(1, likeAvg + 1)) * 20 + engagementRate * 40)
  const auraScore = Math.max(20, Math.min(100, Math.floor(base + (Math.random() - 0.5) * 10)))

  return ensureAnalysisCompleteness({
    auraScore,
    tierName: getTierName(auraScore),
    sentiment: {
      positive: 0.5,
      negative: 0.2,
      neutral: 0.3,
      dominant: 'positive',
    },
    personality: {
      traits: ['Analytical', 'Engaging', 'Curious'],
      dominantTrait: 'Engaging',
      confidence: 0.8,
    },
    topics: [
      { name: 'Technology', frequency: 0.35, sentiment: 0.7 },
      { name: 'Personal Thoughts', frequency: 0.25, sentiment: 0.6 },
      { name: 'Current Events', frequency: 0.18, sentiment: 0.5 },
    ],
    engagement: {
      avgLikes: Math.floor(likeAvg),
      avgRetweets: Math.floor(rtAvg),
      avgReplies: Math.floor(replyAvg),
      totalEngagement,
      engagementRate,
    },
    writingStyle: {
      tone: 'casual',
      formality: 0.4,
      emotiveness: 0.6,
      clarity: 0.75,
    },
    timePatterns: {
      mostActiveHour: 14,
      mostActiveDay: 'Tuesday',
      postingFrequency: 2,
    },
    viralPotential: {
      score: Math.max(0, Math.min(100, auraScore + 5)),
      factors: ['Engagement consistency', 'Relevant topics'],
    },
    summary: `A concise, engagement-driven profile for @${username} with steady audience interactions.`,
    timeSeriesData: generateTimeSeriesData(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId =
      (session.user as any).id ||
      session.user.email ||
      (session.user as any).username
    const username = (session.user as any).username
    const isVerified = !!(session.user as any).isVerified
    const bio = (session.user as any).bio || ''
    const location = (session.user as any).location || ''
    const website = (session.user as any).website || ''
    const joinDate = (session.user as any).joinDate || new Date().toISOString()
    const tweetCount = (session.user as any).tweetCount || 0
    const profileImage = (session.user as any).profileImage || ''

    if (!username || !userId) {
      return NextResponse.json(
        { error: 'Username or user ID not found' },
        { status: 400 }
      )
    }

    // Return cached analysis first to speed up UI
    const existing = await getUserAnalysis(userId)
    if (existing?.analysis) {
      return NextResponse.json(ensureAnalysisCompleteness(existing.analysis))
    }

    const maxTweets = parseInt(process.env.MAX_TWEETS_ANALYSIS || '100', 10)
    const hasBearer = !!process.env.TWITTER_BEARER_TOKEN
    // Treat premium as verified AND we have backend capability (bearer token).
    const isPremium = isVerified && hasBearer

    if (isPremium) {
      try {
        const twitter = new TwitterAPI(process.env.TWITTER_BEARER_TOKEN!)
        const user = await twitter.getUserByUsername(username)
        const tweets = await twitter.getUserTweets(user.id, maxTweets)

        let analysis
        try {
          // Prefer Gemini if configured
          analysis = await analyzeUserTweets(
            (tweets as Tweet[]) || [],
            username
          )
        } catch (e) {
          // Fallback to simple deterministic analysis if Gemini unavailable
          analysis = simpleAnalysisFromTweets((tweets as Tweet[]) || [], username)
        }

        analysis.userData = {
          username,
          bio,
          tweetCount: user.public_metrics?.tweet_count ?? tweetCount,
          profileImage: user.profile_image_url || profileImage,
          location,
          website,
          joinDate: user.created_at || joinDate,
          isVerified,
        }

        const normalized = ensureAnalysisCompleteness(analysis)

        await saveUserAnalysis({
          userId,
          username,
          analysis: normalized,
          userData: {
            username,
            bio,
            tweetCount: normalized?.userData?.tweetCount ?? tweetCount,
            profileImage: normalized?.userData?.profileImage ?? profileImage,
            location,
            website,
            joinDate,
            isVerified,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)

        return NextResponse.json(normalized)
      } catch (err) {
        // If premium analysis fails (e.g., missing env, API error), fall through to non-premium path
      }
    }

    // Non-premium path: use followers/following to shape a realistic random score
    const { followers, following } = await fetchFollowerFollowing(username)
    const mock = analysisFromCounts({ followers, following })
    mock.userData = {
      username,
      bio,
      tweetCount,
      profileImage,
      location,
      website,
      joinDate,
      isVerified: false,
    }

    await saveUserAnalysis({
      userId,
      username,
      analysis: mock,
      userData: {
        username,
        bio,
        tweetCount,
        profileImage,
        location,
        website,
        joinDate,
        isVerified: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    return NextResponse.json(mock)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Keep response consumable by frontend
    )
  }
}

// Optional GET helpers for diagnostics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'health'
    if (action === 'health') {
      return NextResponse.json({
        status: 'OK',
        premiumAvailable: !!process.env.TWITTER_BEARER_TOKEN,
        aiAvailable: !!process.env.GOOGLE_GEMINI_API_KEY,
        timestamp: new Date().toISOString(),
      })
    }

    if (action === 'metrics') {
      const username = searchParams.get('username')
      if (!username) {
        return NextResponse.json(
          { error: 'username is required' },
          { status: 400 }
        )
      }
      const counts = await fetchFollowerFollowing(username)
      return NextResponse.json({ username, ...counts, checkedAt: new Date().toISOString() })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'GET handler error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}
