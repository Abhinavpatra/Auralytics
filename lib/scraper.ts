/**
 * Lightweight HTML scraper for public tweets using Nitter-like mirrors (no Puppeteer).
 * - Best-effort HTML parsing that extracts recent tweets text and timestamps.
 * - Respects options: maxTweets, includeReplies, includeRetweets (as best as possible via HTML hints).
 * - Returns a Tweet[] compatible with our Gemini analyzer.
 *
 * Notes:
 * - Scraping HTML is brittle. If parsing fails, we gracefully return an empty array.
 * - We do NOT fabricate follower/following counts.
 * - If your project already had a custom scraper, you can replace the internals of fetchUserPage()/parseTweets()
 *   to call your existing implementation while keeping the same exported function signature below.
 */

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

export type ScrapeOptions = {
  maxTweets: number
  includeReplies: boolean
  includeRetweets: boolean
}

const NITTER_HOSTS = [
  "https://nitter.net",
  "https://nitter.snopyta.org",
  "https://nitter.poast.org",
  "https://nitter.fdn.fr",
]

async function fetchUserPage(username: string): Promise<string | null> {
  for (const host of NITTER_HOSTS) {
    try {
      const res = await fetch(`${host}/${encodeURIComponent(username)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AuralyticsBot/1.0; +https://example.com/bot)",
          Accept: "text/html",
        },
        // Never cache HTML scraping
        cache: "no-store",
      })
      if (res.ok) {
        const html = await res.text()
        if (html && html.length > 500) return html
      }
    } catch {
      // Try next host
    }
  }
  return null
}

// Extract tweets from Nitter-like HTML.
// This is heuristic and may need adjustments if DOM changes.
function parseTweets(html: string): Tweet[] {
  const tweets: Tweet[] = []

  // Split by tweet container. Nitter often uses 'class="timeline-item"' or 'class="tweet"' per item.
  const blocks = html.split(/<div[^>]+class="(?:timeline-item|tweet)[^"]*"[^>]*>/g).slice(1)

  for (const block of blocks) {
    // ID from status link: href="/{username}/status/{id}"
    const idMatch = block.match(/href="\/[^/]+\/status\/(\d+)"/)
    const id = idMatch?.[1]
    if (!id) continue

    // Text: in <div class="tweet-content media-body"> or <div class="tweet-content">
    const textMatch =
      block.match(/<div[^>]*class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/) ||
      block.match(/<div[^>]*class="content[^"]*"[^>]*>([\s\S]*?)<\/div>/)
    let text = textMatch?.[1] ?? ""
    // Strip tags and decode a few entities
    text = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()

    if (!text) continue

    // Timestamp from <span class="tweet-date"><a href="..."><span title="YYYY-MM-DD HH:MM:SS">...</span></a></span>
    const timeTitleMatch = block.match(/<span[^>]*title="([^"]+?)"[^>]*>/)
    const created_at = timeTitleMatch?.[1] ? new Date(timeTitleMatch[1]).toISOString() : undefined

    // Try to detect replies or retweets via icons/classes in the HTML (heuristic).
    const isRetweet = /icon-retweet|retweet-header/i.test(block)
    const isReply = /icon-reply|in-reply-to/i.test(block)

    const referenced_tweets: Array<{ type: string; id: string }> = []
    if (isRetweet) referenced_tweets.push({ type: "retweeted", id: "unknown" })
    if (isReply) referenced_tweets.push({ type: "replied_to", id: "unknown" })

    // Metrics are not available from HTML reliably; leave as 0
    const public_metrics = {
      like_count: 0,
      retweet_count: 0,
      reply_count: 0,
      quote_count: 0,
    }

    tweets.push({
      id,
      text,
      created_at,
      public_metrics,
      referenced_tweets: referenced_tweets.length ? referenced_tweets : undefined,
    })
  }

  return tweets
}

function filterTweets(tweets: Tweet[], opts: Pick<ScrapeOptions, "includeReplies" | "includeRetweets">): Tweet[] {
  return tweets.filter((t) => {
    if (!opts.includeReplies && Array.isArray(t.referenced_tweets)) {
      if (t.referenced_tweets.some((r) => r.type === "replied_to")) return false
    }
    if (!opts.includeRetweets && Array.isArray(t.referenced_tweets)) {
      if (t.referenced_tweets.some((r) => r.type === "retweeted")) return false
    }
    return true
  })
}

/**
 * Scrape recent tweets for a username.
 * Returns up to opts.maxTweets Tweet objects; empty array on failure.
 */
export async function scrapeUserTweets(username: string, opts: ScrapeOptions): Promise<Tweet[]> {
  try {
    const html = await fetchUserPage(username)
    if (!html) return []

    const allTweets = parseTweets(html)
    const filtered = filterTweets(allTweets, opts)
    return filtered.slice(0, Math.max(1, Math.min(300, opts.maxTweets)))
  } catch {
    return []
  }
}
