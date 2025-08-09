import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { TwitterAPI } from "@/lib/twitter"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const u = session.user as any
    const username: string | undefined = u.username
    const baseProfile = {
      name: u.name ?? null,
      username: username ?? null,
      image: u.image ?? null,
      isVerified: Boolean(u.isVerified ?? false),
      bio: typeof u.bio === "string" ? u.bio : null,
      location: typeof u.location === "string" ? u.location : null,
      website: typeof u.website === "string" ? u.website : null,
      joinDate: typeof u.joinDate === "string" ? u.joinDate : null,
      tweetCount: typeof u.tweetCount === "number" ? u.tweetCount : null,
      profileImage: typeof u.profileImage === "string" ? u.profileImage : null,
    }

    // Optionally enrich with accurate counts from Twitter API if token exists
    if (username && process.env.TWITTER_BEARER_TOKEN) {
      try {
        const api = new TwitterAPI(process.env.TWITTER_BEARER_TOKEN)
        const user = await api.getUserByUsername(username)
        return NextResponse.json({
          ...baseProfile,
          name: baseProfile.name ?? user.name ?? null,
          username: username,
          image: baseProfile.image ?? user.profile_image_url ?? null,
          isVerified: typeof user.verified === "boolean" ? user.verified : baseProfile.isVerified,
          tweetCount:
            typeof user.public_metrics?.tweet_count === "number"
              ? user.public_metrics.tweet_count
              : baseProfile.tweetCount,
          followersCount:
            typeof user.public_metrics?.followers_count === "number" ? user.public_metrics.followers_count : undefined,
          followingCount:
            typeof user.public_metrics?.following_count === "number" ? user.public_metrics.following_count : undefined,
          bio: baseProfile.bio ?? user.description ?? null,
          joinDate: baseProfile.joinDate ?? user.created_at ?? null,
          profileImage: baseProfile.profileImage ?? user.profile_image_url ?? null,
        })
      } catch {
        // If enrichment fails, return base profile only
      }
    }

    return NextResponse.json(baseProfile)
  } catch (error) {
    return NextResponse.json(
      { error: "profile handler error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
