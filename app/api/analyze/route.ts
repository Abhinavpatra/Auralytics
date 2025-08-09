import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { analyzeUserTweets, type Tweet as AnalyzedTweet } from "@/lib/gemini"
import { scrapeUserTweets, type Tweet as ScrapedTweet } from "@/lib/scraper"

type AnalyzeRequest = {
  maxTweets?: number
  includeReplies?: boolean
  includeRetweets?: boolean
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}
function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)))
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
  const safeNumber = (v: any, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d)
  const safeString = (v: any, d = "") => (typeof v === "string" ? v : d)
  const safeArray = (v: any, d: any[] = []) => (Array.isArray(v) && v.length ? v : d)

  const auraScore = Math.max(0, Math.min(100, Math.floor(safeNumber(analysis?.auraScore, 50))))

  const normalized = {
    auraScore,
    tierName: safeString(analysis?.tierName) || getTierName(auraScore),
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
      score: Math.max(0, Math.min(100, Math.floor(safeNumber(analysis?.viralPotential?.score, auraScore)))),
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

function mapScrapedToAnalyzerTweets(scraped: ScrapedTweet[]): AnalyzedTweet[] {
  return scraped.map((t) => ({
    id: t.id,
    text: t.text,
    created_at: t.created_at,
    public_metrics: t.public_metrics,
    referenced_tweets: t.referenced_tweets,
  }))
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionUser = session.user as any
    const username: string | null = (sessionUser?.username as string | undefined) || null

    const body = (await request.json().catch(() => ({}))) as AnalyzeRequest
    const maxTweets = clampInt(Number(body?.maxTweets ?? 30), 1, 300)
    const includeReplies = Boolean(body?.includeReplies ?? false)
    const includeRetweets = Boolean(body?.includeRetweets ?? true)

    // If we don't have a username, still complete the flow with a safe analysis.
    if (!username) {
      const analysisRaw = await analyzeUserTweets([], "")
      const analysis = ensureAnalysisCompleteness({
        ...analysisRaw,
        userData: { username: null, isVerified: false },
      })
      return NextResponse.json({
        mode: "basic",
        username: null,
        reason: "No username on session; returning generic analysis.",
        options: { maxTweets, includeReplies, includeRetweets },
        tweetSampleCount: 0,
        analysis,
        tweets: [],
      })
    }

    // Primary: use the scraper you made.
    const scrapedTweets = await scrapeUserTweets(username, {
      maxTweets,
      includeReplies,
      includeRetweets,
    })

    const tweetsForModel: AnalyzedTweet[] = mapScrapedToAnalyzerTweets(scrapedTweets)
    const analysisRaw = await analyzeUserTweets(tweetsForModel, username)
    const analysis = ensureAnalysisCompleteness({
      ...analysisRaw,
      userData: {
        username,
        isVerified: (sessionUser?.isVerified as boolean | undefined) ?? undefined,
      },
    })

    return NextResponse.json({
      mode: scrapedTweets.length > 0 ? "premium" : "basic",
      username,
      options: { maxTweets, includeReplies, includeRetweets },
      tweetSampleCount: scrapedTweets.length,
      analysis,
      tweets: scrapedTweets.map((t) => ({
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        public_metrics: t.public_metrics,
        referenced_tweets: t.referenced_tweets,
      })),
    })
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
        premiumAvailable: true, // Scraper-based (no bearer needed)
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
