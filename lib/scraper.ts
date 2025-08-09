/**
 * Lightweight HTML scraper for tweets using public mirrors (e.g., Nitter).
 * - Best-effort parsing. If scraping fails, returns [].
 * - No Puppeteer. Server-side fetch only.
 * - Returns a Tweet[] compatible with the analyzer format.
 *
 * Note: Nitter HTML structures can vary. This parser aims to be resilient and
 *       degrade gracefully. It is intentionally conservative and may not capture
 *       all metadata. That's OK since the analyzer has robust fallbacks.
 */

export type ScrapeOptions = {
  maxTweets?: number
  includeReplies?: boolean
  includeRetweets?: boolean
}

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
  referenced_tweets?: Array<{ type: "retweeted" | "replied_to" | "quoted"; id: string }>
}

const NITTER_MIRRORS = ["https://nitter.net", "https://nitter.poast.org", "https://nitter.cz", "https://nitter.it"]

export async function scrapeUserTweets(username: string, opts: ScrapeOptions = {}): Promise<Tweet[]> {
  const maxTweets = Math.max(1, Math.min(300, opts.maxTweets ?? 30))
  const includeReplies = Boolean(opts.includeReplies ?? false)
  const includeRetweets = Boolean(opts.includeRetweets ?? true)

  for (const base of NITTER_MIRRORS) {
    try {
      const url = `${base}/${encodeURIComponent(username)}`
      const res = await fetch(url, {
        // Use server fetch; disable caching to reduce stale HTML
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AuralyticsBot/1.0; +https://example.com/bot)",
          Accept: "text/html,application/xhtml+xml",
        },
      })
      if (!res.ok) continue
      const html = await res.text()
      const tweets = parseNitterHtml(html, { includeReplies, includeRetweets })
      if (tweets.length) {
        return tweets.slice(0, maxTweets)
      }
    } catch {
      // try next mirror
    }
  }
  return []
}

function parseNitterHtml(html: string, flags: { includeReplies: boolean; includeRetweets: boolean }): Tweet[] {
  // Strategy:
  // - Find blocks containing "/status/" to extract IDs.
  // - Capture text content around common tweet content containers.
  // - Detect retweet/reply via presence of keywords.
  // - Metrics are often not reliable via HTML; default to 0 if missing.
  const items: Tweet[] = []

  // Rough split by tweet cards
  const blocks = html.split("/status/").slice(1) // first part is before any tweet
  for (const block of blocks) {
    // Extract ID up to next non-digit
    const idMatch = block.match(/^(\d{5,30})/)
    const id = idMatch?.[1]
    if (!id) continue

    // Basic content extraction: find tweet text within common containers
    // Try a few patterns to locate content near this block
    const text =
      extractBetween(block, 'class="tweet-content', "</div>") ||
      extractBetween(block, 'class="content"', "</div>") ||
      extractBetween(block, 'class="status-content"', "</div>") ||
      ""

    // Clean HTML tags and entities conservatively
    const cleanedText = decodeHtml(
      text
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )

    const isRt = /retweet|retweeted/i.test(block) || /class="retweet"/i.test(block)
    const isReply = /replying to|class="reply-context"/i.test(block)

    // Metrics (best-effort; defaults to 0 if not easily found)
    const likeCount = extractMetric(block, /icon-heart[^>]*>[^<]*<\/span>\s*<span[^>]*>([\d,.]+)/i)
    const retweetCount = extractMetric(block, /icon-retweet[^>]*>[^<]*<\/span>\s*<span[^>]*>([\d,.]+)/i)
    const replyCount = extractMetric(block, /icon-comment[^>]*>[^<]*<\/span>\s*<span[^>]*>([\d,.]+)/i)
    const quoteCount = extractMetric(block, /icon-quote[^>]*>[^<]*<\/span>\s*<span[^>]*>([\d,.]+)/i)

    const referenced_tweets: Tweet["referenced_tweets"] = []
    if (isRt) referenced_tweets.push({ type: "retweeted", id })
    if (isReply) referenced_tweets.push({ type: "replied_to", id })

    const tweet: Tweet = {
      id,
      text: cleanedText,
      public_metrics: {
        like_count: likeCount ?? 0,
        retweet_count: retweetCount ?? 0,
        reply_count: replyCount ?? 0,
        quote_count: quoteCount ?? 0,
      },
      referenced_tweets,
    }

    // Apply filters
    if (!flags.includeReplies && isReply) continue
    if (!flags.includeRetweets && isRt) continue

    items.push(tweet)
  }

  return items
}

function extractBetween(src: string, startMarker: string, endMarker: string): string | null {
  const startIdx = src.toLowerCase().indexOf(startMarker.toLowerCase())
  if (startIdx === -1) return null
  const afterStart = src.slice(startIdx + startMarker.length)
  const endIdx = afterStart.toLowerCase().indexOf(endMarker.toLowerCase())
  if (endIdx === -1) return null
  return afterStart.slice(0, endIdx)
}

function extractMetric(block: string, re: RegExp): number | null {
  const m = block.match(re)
  if (!m?.[1]) return null
  const n = Number(m[1].replace(/[,.]/g, ""))
  return Number.isFinite(n) ? n : null
}

function decodeHtml(s: string): string {
  // Minimal entity decoding
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
