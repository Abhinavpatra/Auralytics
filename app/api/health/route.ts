import { NextResponse } from 'next/server'

export async function GET() {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      nextAuth: !!process.env.NEXTAUTH_SECRET,
      twitter: !!process.env.TWITTER_CLIENT_ID,
      gemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      scraping: process.env.USE_SCRAPING === 'true'
    }
  }

  return NextResponse.json(healthCheck)
}
