/**
 * Gemini-backed analysis helper using the AI SDK.
 * - Uses Google Gemini via the AI SDK to generate a structured analysis from user tweets.
 * - Falls back to a safe local heuristic if the AI call fails or returns invalid JSON.
 *
 * Environment:
 *   - Set GOOGLE_GEMINI_API_KEY on the server for model access.
 *
 * Server-only.
 */

import { generateText } from "ai"
import { google } from "@ai-sdk/google" // Gemini provider via AI SDK [^2]

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
  referenced_tweets?: Array<{ type: string; id: string }>
}

export type Analysis = {
  auraScore: number
  tierName?: string
  sentiment: {
    positive: number
    negative: number
    neutral: number
    dominant: "positive" | "negative" | "neutral"
  }
  personality: {
    traits: string[]
    dominantTrait: string
    confidence: number
  }
  topics: Array<{ name: string; frequency: number; sentiment: number }>
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
  timeSeriesData?: Array<{ date: string; sentiment: number; engagement: number; auraScore: number }>
  userData?: unknown
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, typeof n === "number" && Number.isFinite(n) ? n : 0))
}

function heuristicAnalysis(tweets: Tweet[], username: string | null): Analysis {
  const likeAvg = tweets.reduce((acc, t) => acc + (t.public_metrics?.like_count ?? 0), 0) / Math.max(1, tweets.length)
  const rtAvg = tweets.reduce((acc, t) => acc + (t.public_metrics?.retweet_count ?? 0), 0) / Math.max(1, tweets.length)
  const replyAvg = tweets.reduce((acc, t) => acc + (t.public_metrics?.reply_count ?? 0), 0) / Math.max(1, tweets.length)

  const engagementRate = Math.min(1, (likeAvg + rtAvg + replyAvg) / 100)
  const base = Math.min(85, Math.log10(Math.max(1, likeAvg + 1)) * 20 + engagementRate * 40)
  const auraScore = Math.max(20, Math.min(100, Math.floor(base + (Math.random() - 0.5) * 10)))

  return {
    auraScore,
    tierName: undefined,
    sentiment: { positive: 0.5, negative: 0.2, neutral: 0.3, dominant: "positive" },
    personality: {
      traits: ["Analytical", "Engaging", "Curious"],
      dominantTrait: "Engaging",
      confidence: 0.8,
    },
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
    summary: `A concise, engagement-driven profile for ${
      username ? "@" + username : "this account"
    } with steady audience interactions.`,
  }
}

function buildTweetsContext(tweets: Tweet[]) {
  const sample = tweets.slice(0, 50).map((t) => ({
    text: (t.text ?? "").slice(0, 240),
    likes: t.public_metrics?.like_count ?? 0,
    rts: t.public_metrics?.retweet_count ?? 0,
    replies: t.public_metrics?.reply_count ?? 0,
  }))
  const likeAvg = Math.floor(
    tweets.reduce((acc, t) => acc + (t.public_metrics?.like_count ?? 0), 0) / Math.max(1, tweets.length),
  )
  const rtAvg = Math.floor(
    tweets.reduce((acc, t) => acc + (t.public_metrics?.retweet_count ?? 0), 0) / Math.max(1, tweets.length),
  )
  const replyAvg = Math.floor(
    tweets.reduce((acc, t) => acc + (t.public_metrics?.reply_count ?? 0), 0) / Math.max(1, tweets.length),
  )
  return { sample, likeAvg, rtAvg, replyAvg, count: tweets.length }
}

/**
 * Analyze tweets with Gemini via AI SDK. Falls back to a heuristic if needed.
 */
export async function analyzeUserTweets(tweets: Tweet[], username: string | null): Promise<Analysis> {
  try {
    const stats = buildTweetsContext(tweets)
    const model = google("gemini-1.5-pro") // Uses GOOGLE_GEMINI_API_KEY [^2]

    const system = [
      "You are an expert social media analyst.",
      "Return ONLY compact JSON matching the exact schema requested.",
      "No backticks, no prose, JSON only.",
    ].join(" ")

    const schema = `
{
  "auraScore": number (20..100),
  "sentiment": {
    "positive": number (0..1),
    "negative": number (0..1),
    "neutral": number (0..1),
    "dominant": "positive" | "negative" | "neutral"
  },
  "personality": {
    "traits": string[],
    "dominantTrait": string,
    "confidence": number (0..1)
  },
  "topics": Array<{ "name": string, "frequency": number (0..1), "sentiment": number (0..1) }>,
  "engagement": {
    "avgLikes": number,
    "avgRetweets": number,
    "avgReplies": number,
    "totalEngagement": number,
    "engagementRate": number (0..1)
  },
  "writingStyle": {
    "tone": string,
    "formality": number (0..1),
    "emotiveness": number (0..1),
    "clarity": number (0..1)
  },
  "timePatterns": {
    "mostActiveHour": number (0..23),
    "mostActiveDay": string,
    "postingFrequency": number
  },
  "viralPotential": {
    "score": number (0..100),
    "factors": string[]
  },
  "summary": string
}`.trim()

    const prompt = [
      `User: ${username ? "@" + username : "unknown"}`,
      `TweetsCount: ${stats.count}`,
      `Averages: likes=${stats.likeAvg}, retweets=${stats.rtAvg}, replies=${stats.replyAvg}`,
      "Sample (trimmed):",
      JSON.stringify(stats.sample),
      "",
      "Task: Produce an analysis strictly in the JSON schema below.",
      "Rules:",
      "- Aura score range is 20..100.",
      "- Probabilities must be 0..1.",
      "- Do NOT fabricate follower counts.",
      "- Output must be valid JSON only.",
      "",
      "Schema:",
      schema,
    ].join("\n")

    const { text } = await generateText({
      model,
      system,
      prompt,
      temperature: 0.3,
    }) // [^2]

    const raw = text
      .trim()
      .replace(/^```json/i, "")
      .replace(/```$/i, "")
    const parsed = JSON.parse(raw)

    const likeAvg = stats.likeAvg
    const rtAvg = stats.rtAvg
    const replyAvg = stats.replyAvg
    const totalEngagement = likeAvg + rtAvg + replyAvg
    const engagementRate = Math.min(1, totalEngagement / 100)

    return {
      auraScore:
        typeof parsed.auraScore === "number" && Number.isFinite(parsed.auraScore)
          ? Math.max(20, Math.min(100, Math.floor(parsed.auraScore)))
          : Math.max(20, Math.min(100, Math.floor(50 + Math.random() * 30))),
      sentiment: {
        positive: clamp01(parsed?.sentiment?.positive ?? 0.5),
        negative: clamp01(parsed?.sentiment?.negative ?? 0.2),
        neutral: clamp01(parsed?.sentiment?.neutral ?? 0.3),
        dominant:
          parsed?.sentiment?.dominant === "positive" ||
          parsed?.sentiment?.dominant === "negative" ||
          parsed?.sentiment?.dominant === "neutral"
            ? parsed.sentiment.dominant
            : "positive",
      },
      personality: {
        traits:
          Array.isArray(parsed?.personality?.traits) && parsed.personality.traits.length
            ? parsed.personality.traits.slice(0, 6)
            : ["Creative", "Analytical", "Engaging"],
        dominantTrait:
          typeof parsed?.personality?.dominantTrait === "string" ? parsed.personality.dominantTrait : "Creative",
        confidence: clamp01(parsed?.personality?.confidence ?? 0.75),
      },
      topics:
        Array.isArray(parsed?.topics) && parsed.topics.length
          ? parsed.topics.slice(0, 6).map((t: any) => ({
              name: typeof t?.name === "string" ? t.name : "General",
              frequency: clamp01(typeof t?.frequency === "number" ? t.frequency : 0.2),
              sentiment: clamp01(typeof t?.sentiment === "number" ? t.sentiment : 0.6),
            }))
          : [
              { name: "Technology", frequency: 0.3, sentiment: 0.7 },
              { name: "Personal Thoughts", frequency: 0.25, sentiment: 0.6 },
              { name: "Current Events", frequency: 0.2, sentiment: 0.5 },
            ],
      engagement: {
        avgLikes: Math.max(0, Math.floor(parsed?.engagement?.avgLikes ?? likeAvg)),
        avgRetweets: Math.max(0, Math.floor(parsed?.engagement?.avgRetweets ?? rtAvg)),
        avgReplies: Math.max(0, Math.floor(parsed?.engagement?.avgReplies ?? replyAvg)),
        totalEngagement: Math.max(
          0,
          Math.floor(parsed?.engagement?.totalEngagement ?? totalEngagement * Math.max(1, stats.count)),
        ),
        engagementRate: clamp01(parsed?.engagement?.engagementRate ?? engagementRate),
      },
      writingStyle: {
        tone: typeof parsed?.writingStyle?.tone === "string" ? parsed.writingStyle.tone : "casual",
        formality: clamp01(parsed?.writingStyle?.formality ?? 0.4),
        emotiveness: clamp01(parsed?.writingStyle?.emotiveness ?? 0.6),
        clarity: clamp01(parsed?.writingStyle?.clarity ?? 0.75),
      },
      timePatterns: {
        mostActiveHour: Math.max(
          0,
          Math.min(
            23,
            Math.floor(
              typeof parsed?.timePatterns?.mostActiveHour === "number" ? parsed.timePatterns.mostActiveHour : 14,
            ),
          ),
        ),
        mostActiveDay:
          typeof parsed?.timePatterns?.mostActiveDay === "string" ? parsed.timePatterns.mostActiveDay : "Tuesday",
        postingFrequency:
          typeof parsed?.timePatterns?.postingFrequency === "number" ? parsed.timePatterns.postingFrequency : 2,
      },
      viralPotential: {
        score: Math.max(
          0,
          Math.min(
            100,
            Math.floor(
              typeof parsed?.viralPotential?.score === "number"
                ? parsed.viralPotential.score
                : (parsed?.auraScore ?? 60) + 5,
            ),
          ),
        ),
        factors:
          Array.isArray(parsed?.viralPotential?.factors) && parsed.viralPotential.factors.length
            ? parsed.viralPotential.factors.slice(0, 5)
            : ["Authentic voice", "Engaging content"],
      },
      summary:
        typeof parsed?.summary === "string"
          ? parsed.summary
          : `A concise, engagement-driven profile for ${username ? "@" + username : "this account"}.`,
    }
  } catch {
    return heuristicAnalysis(tweets, username)
  }
}
