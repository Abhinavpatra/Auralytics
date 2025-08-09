import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { analyzeUserTweets, type Tweet as ModelTweet } from "@/lib/gemini"
import { scrapeUserTweets, type Tweet as ScrapedTweet } from "@/lib/scraper"

// -------------------- Types --------------------

type AnalyzeRequest = {
  maxTweets?: number
  includeReplies?: boolean
  includeRetweets?: boolean
}

type AnalysisWrapper = {
  mode: "premium" | "basic"
  username: string | null
  reason?: string
  options: {
    maxTweets: number
    includeReplies: boolean
    includeRetweets: boolean
  }
  tweetSampleCount: number
  analysis: any
  tweets: Array<{
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
  }>
}

// -------------------- Helpers --------------------

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}
function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)))
}
function randomInt(min: number, max: number) {
  const lo = Math.ceil(min)
  const hi = Math.floor(max)
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}
function getTierName(score: number): string {
  if (score >= 96) return "Aura God"
  if (score >= 91) return "Amrit Sir"
  if (score >= 81) return "Aura Farmer"
  if (score >= 61) return "Occasional Legend"
  if (score >= 41) return "Aura Farmer"
  if (score >= 21) return "Upcoming Sage"
  return "Noob"
}
function generateTimeSeriesData() {
  const data: Array<{ date: string; sentiment: number; engagement: number; auraScore: number }> = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const base = 50 + Math.sin((i / 30) * Math.PI * 2) * 20 + (Math.random() - 0.5) * 10
    data.push({
      date: date.toISOString().split("T")[0],
      sentiment: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * 12)),
      engagement: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * 15)),
      auraScore: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * 8)),
    })
  }
  return data
}
function ensureAnalysisCompleteness(analysis: any) {
  const safeNumber = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d)
  const safeString = (v: unknown, d = "") => (typeof v === "string" ? v : d)
  const safeArray = (v: unknown, d: any[] = []) => (Array.isArray(v) && (v as any[]).length ? (v as any[]) : d)

  const unameRaw = analysis?.userData?.username
  const uname = typeof unameRaw === "string" ? unameRaw : null
  const isVerified = Boolean(analysis?.userData?.isVerified)

  // Special usernames with fixed score of 96
  const specialUsernames = new Set([
    "just_avik",
    "heyhexadecimal",
    "shydev69",
    "patrabuilds",
    "nihaldevv",
    "amaan8429",
    "0xtuberculosis",
  ])

  // Compute auraScore per your rules:
  // - if username in special list -> 96
  // - else if verified -> random 80..100
  // - else -> random 0..79
  let auraScore: number
  if (uname && specialUsernames.has(uname.toLowerCase())) {
    auraScore = 96
  } else if (isVerified) {
    auraScore = randomInt(80, 100)
  } else {
    auraScore = randomInt(0, 79)
  }

  const normalized = {
    auraScore: Math.max(0, Math.min(100, Math.floor(auraScore))),
    tierName: "", // filled below via getTierName
    sentiment: {
      positive: clamp01(safeNumber(analysis?.sentiment?.positive, 0.5)),
      negative: clamp01(safeNumber(analysis?.sentiment?.negative, 0.2)),
      neutral: clamp01(safeNumber(analysis?.sentiment?.neutral, 0.3)),
      dominant:
        analysis?.sentiment?.dominant === "positive" ||
        analysis?.sentiment?.dominant === "negative" ||
        analysis?.sentiment?.dominant === "neutral"
          ? analysis.sentiment.dominant
          : "positive",
    },
    personality: {
      traits: safeArray(analysis?.personality?.traits, ["Creative", "Analytical", "Engaging"]),
      dominantTrait: safeString(analysis?.personality?.dominantTrait, "Creative"),
      confidence: clamp01(safeNumber(analysis?.personality?.confidence, 0.75)),
    },
    topics: safeArray(analysis?.topics, [
      { name: "Technology", frequency: 0.3, sentiment: 0.7 },
      { name: "Personal Thoughts", frequency: 0.25, sentiment: 0.6 },
      { name: "Current Events", frequency: 0.2, sentiment: 0.5 },
    ]).map((t: any) => ({
      name: safeString(t?.name, "General"),
      frequency: clamp01(safeNumber(t?.frequency, 0.2)),
      sentiment: clamp01(safeNumber(t?.sentiment, 0.6)),
    })),
    engagement: {
      avgLikes: Math.max(0, Math.floor(safeNumber(analysis?.engagement?.avgLikes, 20))),
      avgRetweets: Math.max(0, Math.floor(safeNumber(analysis?.engagement?.avgRetweets, 5))),
      avgReplies: Math.max(0, Math.floor(safeNumber(analysis?.engagement?.avgReplies, 3))),
      totalEngagement: Math.max(0, Math.floor(safeNumber(analysis?.engagement?.totalEngagement, 500))),
      engagementRate: clamp01(safeNumber(analysis?.engagement?.engagementRate, 0.03)),
    },
    writingStyle: {
      tone: safeString(analysis?.writingStyle?.tone, "casual"),
      formality: clamp01(safeNumber(analysis?.writingStyle?.formality, 0.4)),
      emotiveness: clamp01(safeNumber(analysis?.writingStyle?.emotiveness, 0.6)),
      clarity: clamp01(safeNumber(analysis?.writingStyle?.clarity, 0.75)),
    },
    timePatterns: {
      mostActiveHour: Math.max(0, Math.min(23, Math.floor(safeNumber(analysis?.timePatterns?.mostActiveHour, 14)))),
      mostActiveDay: safeString(analysis?.timePatterns?.mostActiveDay, "Tuesday"),
      postingFrequency: Math.max(0.1, safeNumber(analysis?.timePatterns?.postingFrequency, 2.0)),
    },
    viralPotential: {
      score: Math.max(
        0,
        Math.min(100, Math.floor(safeNumber(analysis?.viralPotential?.score, Math.max(0, Math.min(100, auraScore))))),
      ),
      factors: safeArray(analysis?.viralPotential?.factors, ["Authentic voice", "Engaging content"]),
    },
    summary: safeString(
      analysis?.summary,
      "A creative and engaging digital presence with growing community interaction.",
    ),
    timeSeriesData: safeArray(analysis?.timeSeriesData, generateTimeSeriesData()),
    userData: analysis?.userData || undefined,
  }

  normalized.tierName = getTierName(normalized.auraScore)
  return normalized
}

function mapScrapedToModelTweets(scraped: ScrapedTweet[]): ModelTweet[] {
  return scraped.map((t) => ({
    id: t.id,
    text: t.text,
    created_at: t.created_at,
    public_metrics: t.public_metrics,
    referenced_tweets: t.referenced_tweets,
  }))
}

// -------------------- Route Handlers --------------------

export async function POST(request: NextRequest) {
  try {
    // Try to get the username from session, but do NOT require it.
    const session = await getServerSession(authOptions).catch(() => null)
    const sessionUser = (session?.user as any) || undefined
    const username: string | null = (sessionUser?.username as string | undefined) || null

    const body = (await request.json().catch(() => ({}))) as AnalyzeRequest
    const maxTweets = clampInt(Number(body?.maxTweets ?? 30), 1, 300)
    const includeReplies = Boolean(body?.includeReplies ?? false)
    const includeRetweets = Boolean(body?.includeRetweets ?? true)

    // If we have a username, try scraper; else proceed with empty tweets.
    let tweets: ScrapedTweet[] = []
    if (username) {
      try {
        tweets = await scrapeUserTweets(username, { maxTweets, includeReplies, includeRetweets })
      } catch {
        tweets = []
      }
    }

    const analysisRaw = await analyzeUserTweets(mapScrapedToModelTweets(tweets), username)
    const analysis = ensureAnalysisCompleteness({
      ...analysisRaw,
      userData: {
        username: username,
        isVerified: (sessionUser?.isVerified as boolean | undefined) ?? undefined,
      },
    })

    const resPayload: AnalysisWrapper = {
      mode: tweets.length > 0 ? "premium" : "basic",
      username,
      reason: !username ? "No username available; returning generic analysis." : undefined,
      options: { maxTweets, includeReplies, includeRetweets },
      tweetSampleCount: tweets.length,
      analysis,
      tweets: tweets.map((t) => ({
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        public_metrics: t.public_metrics,
        referenced_tweets: t.referenced_tweets,
      })),
    }

    return NextResponse.json(resPayload)
  } catch (error) {
    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "health"
    if (action === "health") {
      return NextResponse.json({
        status: "OK",
        premiumAvailable: true, // Scraper path always usable (best-effort)
        timestamp: new Date().toISOString(),
      })
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: "GET handler error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
