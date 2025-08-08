import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TwitterAPI } from '@/lib/twitter'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = (session?.user as any) || undefined

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Base payload: only include what we actually have in the session.
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

    // Try to enrich with accurate counts via app bearer token (optional).
    // If we can't, we just return the base session data—no placeholders.
    const bearer = process.env.TWITTER_BEARER_TOKEN
    if (bearer && user?.username) {
      try {
        const twitter = new TwitterAPI(bearer)
        const profile = await twitter.getUserByUsername(user.username)
        // Only attach values that we know for sure.
        if (profile?.public_metrics) {
          const { followers_count, following_count, tweet_count } = profile.public_metrics
          if (typeof followers_count === 'number') base.followersCount = followers_count
          if (typeof following_count === 'number') base.followingCount = following_count
          if (typeof tweet_count === 'number') base.tweetCount = tweet_count
        }
        if (typeof profile?.verified === 'boolean') base.isVerified = profile.verified
        if (profile?.profile_image_url) base.profileImage = profile.profile_image_url
        if (profile?.created_at) base.joinDate = profile.created_at
        if (profile?.description) base.bio = profile.description
      } catch {
        // Swallow errors and just return base session data
      }
    }

    return NextResponse.json(base, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load profile', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 200 }
    )
  }
}
