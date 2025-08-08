import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TwitterAPI } from '@/lib/twitter'

// Returns only accurate fields from session; optionally enriches with public_metrics
// via app bearer token if available. Never fabricates values.
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = (session?.user as any) || undefined

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const base: Record<string, any> = {}
    if (user.id) base.id = user.id
    if (user.name) base.name = user.name
    if (user.username) base.username = user.username
    if (user.email) base.email = user.email
    if (user.image) base.image = user.image
    if (typeof user.isVerified === 'boolean') base.isVerified = user.isVerified
    if (typeof user.tweetCount === 'number') base.tweetCount = user.tweetCount
    if (user.bio) base.bio = user.bio
    if (user.location) base.location = user.location
    if (user.website) base.website = user.website
    if (user.joinDate) base.joinDate = user.joinDate
    if (user.profileImage) base.profileImage = user.profileImage

    const bearer = process.env.TWITTER_BEARER_TOKEN
    if (bearer && user?.username) {
      try {
        const twitter = new TwitterAPI(bearer)
        const profile = (await twitter.getUserByUsername(user.username)) as any

        const pm = profile?.public_metrics
        if (pm && typeof pm.followers_count === 'number') {
          base.followersCount = pm.followers_count
        }
        if (pm && typeof pm.following_count === 'number') {
          base.followingCount = pm.following_count
        }
        if (pm && typeof pm.tweet_count === 'number') {
          base.tweetCount = pm.tweet_count
        }
        if (typeof profile?.verified === 'boolean') {
          base.isVerified = profile.verified
        }
        if (typeof profile?.description === 'string' && profile.description) {
          base.bio = profile.description
        }
        if (typeof profile?.created_at === 'string' && profile.created_at) {
          base.joinDate = profile.created_at
        }
        if (typeof profile?.profile_image_url === 'string' && profile.profile_image_url) {
          base.profileImage = profile.profile_image_url
        }
      } catch {
        // Ignore enrichment failures; return whatever the session has
      }
    }

    return NextResponse.json(base, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to load profile',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}
