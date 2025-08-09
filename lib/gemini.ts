// Stateless engagement-based analysis (no external AI dependency).
// The analyze route will call this immediately after fetching tweets.

export type Tweet = {
  id: string
  text: string
  created_at?: string
  public_metrics?: {
    like_count?: number
    retweet_count?: number
    reply_count?: number
    quote_count?: number
  }
}

export async function analyzeUserTweets(tweets: Tweet[], username: string) {
  const likeAvg = tweets.reduce((acc, t) => acc + (t.public_metrics?.like_count ?? 0), 0) / Math.max(1, tweets.length)
  const rtAvg = tweets.reduce((acc, t) => acc + (t.public_metrics?.retweet_count ?? 0), 0) / Math.max(1, tweets.length)
  const replyAvg = tweets.reduce((acc, t) => acc + (t.public_metrics?.reply_count ?? 0), 0) / Math.max(1, tweets.length)

  const engagementRate = Math.min(1, (likeAvg + rtAvg + replyAvg) / 100)
  const base = Math.min(85, Math.log10(Math.max(1, likeAvg + 1)) * 20 + engagementRate * 40)
  const auraScore = Math.max(20, Math.min(100, Math.floor(base + (Math.random() - 0.5) * 10)))

  return {
    auraScore,
    tierName: undefined, // normalized in the route
    sentiment: { positive: 0.5, negative: 0.2, neutral: 0.3, dominant: "positive" as const },
    personality: { traits: ["Analytical", "Engaging", "Curious"], dominantTrait: "Engaging", confidence: 0.8 },
    topics: [
      { name: "Technology", frequency: 0.35, sentiment: 0.7 },
      { name: "Personal Thoughts", frequency: 0.25, sentiment: 0.6 },
      { name: "Current Events", frequency: 0.18, sentiment: 0.5 },
    ],
    engagement: {
      avgLikes: Math.floor(likeAvg),
      avgRetweets: Math.floor(rtAvg),
      avgReplies: Math.floor(replyAvg),
      totalEngagement: Math.floor((likeAvg + rtAvg + replyAvg) * tweets.length),
      engagementRate,
    },
    writingStyle: { tone: "casual", formality: 0.4, emotiveness: 0.6, clarity: 0.75 },
    timePatterns: { mostActiveHour: 14, mostActiveDay: "Tuesday", postingFrequency: 2 },
    viralPotential: {
      score: Math.max(0, Math.min(100, auraScore + 5)),
      factors: ["Engagement consistency", "Relevant topics"],
    },
    summary: `A concise, engagement-driven profile for @${username} with steady audience interactions.`,
  }
}
