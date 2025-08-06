import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error('GOOGLE_GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

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
}

export async function analyzeUserTweets(tweets: Tweet[], username: string): Promise<AuraAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
Analyze the following ${tweets.length} tweets from user @${username} and provide a comprehensive digital persona analysis.

TWEETS DATA:
${tweets.map(tweet => `
Tweet ID: ${tweet.id}
Date: ${tweet.created_at}
Text: "${tweet.text}"
Engagement: ${tweet.public_metrics.like_count} likes, ${tweet.public_metrics.retweet_count} retweets, ${tweet.public_metrics.reply_count} replies
---`).join('\n')}

Please analyze and return a JSON response with the following structure:

{
  "auraScore": <number 0-100>,
  "tierName": "<tier based on score>",
  "sentiment": {
    "positive": <decimal 0-1>,
    "negative": <decimal 0-1>, 
    "neutral": <decimal 0-1>,
    "dominant": "<positive|negative|neutral>"
  },
  "personality": {
    "traits": ["<trait1>", "<trait2>", "<trait3>"],
    "dominantTrait": "<main personality trait>",
    "confidence": <decimal 0-1>
  },
  "topics": [
    {
      "name": "<topic name>",
      "frequency": <decimal 0-1>,
      "sentiment": <decimal -1 to 1>
    }
  ],
  "engagement": {
    "avgLikes": <number>,
    "avgRetweets": <number>,
    "avgReplies": <number>,
    "totalEngagement": <number>,
    "engagementRate": <decimal>
  },
  "writingStyle": {
    "tone": "<casual|professional|humorous|serious|etc>",
    "formality": <decimal 0-1>,
    "emotiveness": <decimal 0-1>,
    "clarity": <decimal 0-1>
  },
  "timePatterns": {
    "mostActiveHour": <0-23>,
    "mostActiveDay": "<day of week>",
    "postingFrequency": <posts per day>
  },
  "viralPotential": {
    "score": <number 0-100>,
    "factors": ["<factor1>", "<factor2>"]
  },
  "summary": "<2-3 sentence summary of their digital persona>"
}

AURA SCORE CALCULATION:
- Base score on sentiment balance, engagement quality, content diversity, authenticity
- 0-20: "Noob" - New or inactive user
- 21-40: "Upcoming Sage" - Growing presence
- 41-60: "Aura Farmer" - Consistent content creator
- 61-80: "Occasional Legend" - High engagement, good content
- 81-90: "Aura Farmer" - Viral potential, strong presence
- 91-95: "Amrit Sir" - Thought leader, high influence
- 96-100: "Aura God" - Maximum digital charisma

Focus on authenticity, engagement quality, content diversity, and positive community impact.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response')
    }
    
    const analysis = JSON.parse(jsonMatch[0]) as AuraAnalysis
    
    // Validate and ensure tier name matches score
    analysis.tierName = getTierName(analysis.auraScore)
    
    return analysis
  } catch (error) {
    console.error('Gemini analysis error:', error)
    throw new Error('Failed to analyze tweets with Gemini AI')
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

export { getTierName }
