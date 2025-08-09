import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Stateless tweet analysis route.
 * - No database or persistence.
 * - Uses the logged-in user's X username from the session.
 * - If TWITTER_BEARER_TOKEN is set, fetches tweets via X API v2 and analyzes them right away.
 * - Returns only accurate data. If we can't fetch tweets, we return a 'basic' mode with an explanation.
 */

type AnalyzeRequest = {
  maxTweets?: number
  includeReplies?: boolean
  includeRetweets?: boolean
}

type Tweet = {
  id: string
  text: string
  created_at?: string
  public_metrics?: {
    like_count?: number
    retweet_count?: number
    reply_count?: number
    quote_count?: number
    impression_count?: number // only available with certain access
  }
  referenced_tweets?: Array<{ type: string; id: string }>
}

type Analysis = {
  tweetCount: number
  averages: {
    likes: number
    retweets: number
    replies: number
    quotes: number
    impressions?: number | null
  }
  engagementScore: number
  topWords: Array<{ word: string; count: number }>
}

function isRetweet(tweet: Tweet): boolean {
  return Array.isArray(tweet.referenced_tweets) ? tweet.referenced_tweets.some((r) => r.type === "retweeted") : false
}

function isReply(tweet: Tweet): boolean {
  return Array.isArray(tweet.referenced_tweets) ? tweet.referenced_tweets.some((r) => r.type === "replied_to") : false
}

function simpleAnalyze(tweets: Tweet[]): Analysis {
  const safe = tweets || []
  const n = safe.length || 0

  const sum = safe.reduce(
    (acc, t) => {
      const m = t.public_metrics || {}
      acc.likes += m.like_count || 0
      acc.retweets += m.retweet_count || 0
      acc.replies += m.reply_count || 0
      acc.quotes += m.quote_count || 0
      if (typeof m.impression_count === "number") {
        acc.impressions.sum += m.impression_count
        acc.impressions.count += 1
      }
      return acc
    },
    {
      likes: 0,
      retweets: 0,
      replies: 0,
      quotes: 0,
      impressions: { sum: 0, count: 0 },
    },
  )

  const averages = {
    likes: n ? Math.round(sum.likes / n) : 0,
    retweets: n ? Math.round(sum.retweets / n) : 0,
    replies: n ? Math.round(sum.replies / n) : 0,
    quotes: n ? Math.round(sum.quotes / n) : 0,
    impressions: sum.impressions.count > 0 ? Math.round(sum.impressions.sum / sum.impressions.count) : null,
  }

  // A very simple engagement score heuristic (bounded 0-100)
  const engagementScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (averages.likes * 0.5 + averages.retweets * 0.3 + averages.replies * 0.15 + averages.quotes * 0.05) / 5,
      ),
    ),
  )

  // Naive top words (exclude URLs/mentions/short words)
  const wordCounts = new Map<string, number>()
  for (const t of safe) {
    const text = t.text || ""
    const words = text
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[@#][\w_-]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4)
    for (const w of words) {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1)
    }
  }
  const topWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  return {
    tweetCount: n,
    averages,
    engagementScore,
    topWords,
  }
}

async function fetchUserIdByUsername(username: string, bearer: string): Promise<string | null> {
  const res = await fetch(
    `https://api.x.com/2/users/by/username/${encodeURIComponent(username)}?user.fields=public_metrics,created_at,verified,description,profile_image_url`,
    {
      headers: { Authorization: `Bearer ${bearer}` },
      cache: "no-store",
    },
  )
  if (!res.ok) return null
  const data = (await res.json()) as any
  return data?.data?.id || null
}

async function fetchUserTweets(
  userId: string,
  opts: { maxTweets: number; includeReplies: boolean; includeRetweets: boolean },
  bearer: string,
): Promise<Tweet[]> {
  const out: Tweet[] = []
  let paginationToken: string | undefined = undefined
  const maxPerPage = 100
  const maxToFetch = Math.max(1, Math.min(300, opts.maxTweets || 20))

  // Build excludes array for replies/retweets
  const excludes: string[] = []
  if (!opts.includeReplies) excludes.push("replies")
  if (!opts.includeRetweets) excludes.push("retweets")

  while (out.length < maxToFetch) {
    const limit = Math.min(maxPerPage, maxToFetch - out.length)
    const params = new URLSearchParams({
      max_results: String(limit),
      "tweet.fields": "created_at,public_metrics,referenced_tweets",
    })
    if (excludes.length) {
      // The API supports exclude=retweets,replies
      params.set("exclude", excludes.join(","))
    }
    if (paginationToken) params.set("pagination_token", paginationToken)

    const url = `https://api.x.com/2/users/${userId}/tweets?${params.toString()}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${bearer}` },
      cache: "no-store",
    })
    if (!res.ok) break
    const data = (await res.json()) as any
    const pageTweets: Tweet[] = data?.data || []
    out.push(...pageTweets)
    paginationToken = data?.meta?.next_token
    if (!paginationToken || pageTweets.length === 0) break
  }

  // Extra guard to enforce includeReplies/includeRetweets in case exclude param is ignored
  const filtered = out.filter((t) => {
    if (!opts.includeReplies && isReply(t)) return false
    if (!opts.includeRetweets && isRetweet(t)) return false
    return true
  })

  return filtered.slice(0, maxToFetch)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionUser = session.user as any
    const username: string | undefined = sessionUser?.username
    if (!username) {
      return NextResponse.json({ error: "Your X username is not available from the session." }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as AnalyzeRequest
    const maxTweets = Math.max(1, Math.min(300, body?.maxTweets ?? 30))
    const includeReplies = Boolean(body?.includeReplies ?? false)
    const includeRetweets = Boolean(body?.includeRetweets ?? true)

    const bearer = process.env.TWITTER_BEARER_TOKEN
    if (!bearer) {
      // No ability to fetch tweets. Return a basic response explaining the limitation.
      return NextResponse.json(
        {
          mode: "basic",
          username,
          reason: "Missing TWITTER_BEARER_TOKEN; cannot fetch tweets.",
          analysis: null,
          tweets: [],
        },
        { status: 200 },
      )
    }

    // Resolve user id and fetch tweets
    const userId = await fetchUserIdByUsername(username, bearer)
    if (!userId) {
      return NextResponse.json(
        {
          mode: "basic",
          username,
          reason: "Could not resolve X user ID for the current session.",
          analysis: null,
          tweets: [],
        },
        { status: 200 },
      )
    }

    const tweets = await fetchUserTweets(userId, { maxTweets, includeReplies, includeRetweets }, bearer)

    // Analyze immediately after extracting tweets (no persistence)
    const analysis: Analysis = simpleAnalyze(tweets)

    return NextResponse.json(
      {
        mode: "premium",
        username,
        options: { maxTweets, includeReplies, includeRetweets },
        tweetSampleCount: tweets.length,
        analysis,
        // For transparency but without leaking sensitive fields:
        tweets: tweets.map((t) => ({
          id: t.id,
          text: t.text,
          created_at: t.created_at,
          public_metrics: t.public_metrics,
          referenced_tweets: t.referenced_tweets,
        })),
      },
      { status: 200 },
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to analyze tweets", details: String(err?.message || err) },
      { status: 500 },
    )
  }
}
