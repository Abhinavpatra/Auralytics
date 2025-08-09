/**
 * Puppeteer-based utilities:
 * - isUserVerifiedPuppeteer: detect if X profile shows a verified badge
 * - scrapeUserTweetsPuppeteer: best-effort tweet scrape for verified users
 *
 * Uses puppeteer locally, and puppeteer-core + @sparticuz/chromium on serverless.
 * All imports are dynamic to avoid TypeScript resolution errors when packages
 * are not installed in the current environment.
 */

import type { Tweet as ScrapedTweet, ScrapeOptions } from "@/lib/scraper"

async function launchBrowser() {
  // Detect serverless/Vercel-like environments
  const isServerless = !!process.env.VERCEL || !!process.env.VERCEL_ENV || !!process.env.AWS_LAMBDA_FUNCTION_NAME

  const headless = true

  if (isServerless) {
    // Serverless: puppeteer-core + @sparticuz/chromium
    const chromium: any = (await import("@sparticuz/chromium")).default
    const puppeteerCore: any = await import("puppeteer-core")
    const executablePath = await chromium.executablePath()
    return puppeteerCore.launch({
      headless,
      args: chromium.args,
      executablePath,
    })
  } else {
    // Local dev: full puppeteer
    const puppeteer: any = await import("puppeteer")
    return puppeteer.launch({ headless })
  }
}

export async function isUserVerifiedPuppeteer(username: string): Promise<boolean> {
  let browser: any
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    await page.goto(`https://mobile.twitter.com/${encodeURIComponent(username)}`, {
      waitUntil: "networkidle2",
      timeout: 45_000,
    })

    const isVerified = await page.evaluate(() => {
      const selectors = [
        'svg[data-testid="icon-verified"]',
        '[aria-label="Verified account"]',
        '[data-testid="verified-badge"]',
        'svg[aria-label="Verified"]',
      ]
      return selectors.some((sel) => document.querySelector(sel))
    })

    return !!isVerified
  } catch {
    return false
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch {}
    }
  }
}

export async function scrapeUserTweetsPuppeteer(username: string, opts: ScrapeOptions = {}): Promise<ScrapedTweet[]> {
  const maxTweets = Math.max(1, Math.min(300, opts.maxTweets ?? 30))

  let browser: any
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.goto(`https://mobile.twitter.com/${encodeURIComponent(username)}`, {
      waitUntil: "networkidle2",
      timeout: 60_000,
    })

    // Load a bit more content
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1500)
    }

    const tweets: ScrapedTweet[] = await page.evaluate((limit: number) => {
      function decodeHtml(s: string) {
        return s
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
      }

      const seen = new Set<string>()
      const result: ScrapedTweet[] = []
      const anchors = Array.from(document.querySelectorAll('a[href*="/status/"]')) as HTMLAnchorElement[]

      for (const a of anchors) {
        const href = a.getAttribute("href") || ""
        const m = href.match(/\/status\/(\d+)/)
        const id = m?.[1]
        if (!id || seen.has(id)) continue

        const container = a.closest('article, div[role="article"]') || a.closest("table") || a.parentElement

        let rawText = ""
        if (container) rawText = (container as HTMLElement).innerText || ""

        const text = decodeHtml(rawText)
          .trim()
          .replace(/\s+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")

        if (!text.length) continue

        result.push({
          id,
          text,
          public_metrics: {
            like_count: 0,
            retweet_count: 0,
            reply_count: 0,
            quote_count: 0,
          },
          referenced_tweets: [],
        })
        seen.add(id)
        if (result.length >= limit) break
      }

      return result
    }, maxTweets)

    return tweets
  } catch {
    return []
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch {}
    }
  }
}
