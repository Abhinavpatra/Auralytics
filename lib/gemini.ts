import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export interface Tweet {
  id: string
  text: string
  created_at: string
  public_metrics: {
    like_count: number
    retweet_count: number
    reply_count: number
    quote_count: number
  }
}

export interface AuraAnalysis {
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

export async function analyzeUserTweets(
  tweets: Tweet[],
  username: string
): Promise<AuraAnalysis> {
  if (!genAI) {
    throw new Error('GEMINI_NOT_CONFIGURED')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
Analyze the following ${tweets.length} tweets from user @${username} and provide a comprehensive digital persona analysis.

TWEETS DATA:
${tweets
  .map(
    (tweet) => `
Tweet ID: ${tweet.id}
Date: ${tweet.created_at}
Text: "${tweet.text}"
Engagement: ${tweet.public_metrics.like_count} likes, ${tweet.public_metrics.retweet_count} retweets, ${tweet.public_metrics.reply_count} replies
---`
  )
  .join('\n')}

Return ONLY valid JSON with this exact structure and numbers within the documented ranges:
{
  "auraScore": <0-100>,
  "tierName": "<tier>",
  "sentiment": {
    "positive": <0-1>,
    "negative": <0-1>, 
    "neutral": <0-1>,
    "dominant": "<positive|negative|neutral>"
  },
  "personality": {
    "traits": ["<trait1>", "<trait2>", "<trait3>"],
    "dominantTrait": "<main trait>",
    "confidence": <0-1>
  },
  "topics": [
    { "name": "<topic>", "frequency": <0-1>, "sentiment": <0-1> }
  ],
  "engagement": {
    "avgLikes": <number>,
    "avgRetweets": <number>,
    "avgReplies": <number>,
    "totalEngagement": <number>,
    "engagementRate": <0-1>
  },
  "writingStyle": {
    "tone": "<casual|professional|humorous|serious|etc>",
    "formality": <0-1>,
    "emotiveness": <0-1>,
    "clarity": <0-1>
  },
  "timePatterns": {
    "mostActiveHour": <0-23>,
    "mostActiveDay": "<day>",
    "postingFrequency": <number>
  },
  "viralPotential": {
    "score": <0-100>,
    "factors": ["<factor1>", "<factor2>"]
  },
  "summary": "<2-3 sentences>"
}
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  const jsonMatch = text.match(/\{[\s\S]*\}$/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in Gemini response')
  }

  const analysis = JSON.parse(jsonMatch[0]) as AuraAnalysis
  analysis.tierName = getTierName(analysis.auraScore)
  return analysis
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

export { getTierName }
