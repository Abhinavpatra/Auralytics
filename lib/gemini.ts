// Minimal Tweet type and analysis function used by app/api/analyze/route.ts

export type Tweet = {
  id: string
  text: string
  created_at?: string
  public_metrics?: {
    like_count?: number
    retweet_count?: number
    reply_count?: number
  }
}

// Pure, no-external-API fallback analysis.
// If you later want to wire an LLM, you can branch by env and enhance the result.
export async function analyzeUserTweets(tweets: Tweet[], username: string) {
  const count = Math.max(1, tweets.length)

  const likes =
    tweets.reduce((acc, t) => acc + (t.public_metrics?.like_count ?? 0), 0) /
    count
  const rts =
    tweets.reduce((acc, t) => acc + (t.public_metrics?.retweet_count ?? 0), 0) /
    count
  const replies =
    tweets.reduce((acc, t) => acc + (t.public_metrics?.reply_count ?? 0), 0) /
    count

  const engagementPerPost = likes + rts + replies
  const engagementRate = Math.min(1, engagementPerPost / 100)

  // Heuristic score purely from engagement, clamped 20-95
  const base =
    Math.min(85, Math.log10(Math.max(1, engagementPerPost + 1)) * 18) +
    engagementRate * 35
  const auraScore = Math.max(
    20,
    Math.min(95, Math.floor(base + (Math.random() - 0.5) * 8))
  )

  const topics = [
    { name: 'Technology', frequency: 0.3, sentiment: 0.65 },
    { name: 'Personal Thoughts', frequency: 0.22, sentiment: 0.58 },
    { name: 'Current Events', frequency: 0.18, sentiment: 0.52 },
  ]

  const now = new Date()
  const timeSeriesData = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    const basePoint =
      50 + Math.sin(((29 - i) / 30) * Math.PI * 2) * 18 + (Math.random() - 0.5) * 8
    return {
      date: d.toISOString().split('T')[0],
      sentiment: Math.max(0, Math.min(100, basePoint + (Math.random() - 0.5) * 10)),
      engagement: Math.max(0, Math.min(100, basePoint + (Math.random() - 0.5) * 12)),
      auraScore: Math.max(0, Math.min(100, basePoint + (Math.random() - 0.5) * 6)),
    }
  })

  return {
    auraScore,
    tierName: '—', // caller normalizes with getTierName()
    sentiment: {
      positive: 0.5,
      negative: 0.2,
      neutral: 0.3,
      dominant: 'positive' as const,
    },
    personality: {
      traits: ['Analytical', 'Engaging', 'Curious'],
      dominantTrait: 'Engaging',
      confidence: 0.8,
    },
    topics,
    engagement: {
      avgLikes: Math.floor(likes),
      avgRetweets: Math.floor(rts),
      avgReplies: Math.floor(replies),
      totalEngagement: Math.floor(engagementPerPost * count),
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
      postingFrequency: Math.max(0.1, Math.min(6, count / 14)),
    },
    viralPotential: {
      score: Math.max(0, Math.min(100, auraScore + 4)),
      factors: ['Engagement consistency', 'Relevant topics'],
    },
    summary: `A concise, engagement-driven profile for @${username} with steady audience interactions.`,
    timeSeriesData,
  }
}
