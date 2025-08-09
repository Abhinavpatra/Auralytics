import type { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"

/**
 * NextAuth options for Twitter (X) login.
 * Note: No database or persistence is used anywhere.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "demo-client-secret",
      version: "2.0",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // When the user signs in, enrich the token with whatever data the provider returns.
      if (account && profile) {
        // Twitter profile is not strictly typed by next-auth; treat as any and guard.
        const p = profile as any

        // Only assign values that actually exist to avoid fake placeholders.
        const username = p?.username || p?.screen_name || undefined
        const tweetCount: number | undefined =
          typeof p?.public_metrics?.tweet_count === "number" ? p.public_metrics.tweet_count : undefined
        const isVerified: boolean | undefined = typeof p?.verified === "boolean" ? p.verified : undefined
        const profileImage: string | undefined =
          typeof p?.profile_image_url === "string" ? p.profile_image_url : undefined
        const bannerImage: string | undefined =
          typeof p?.profile_banner_url === "string" ? p.profile_banner_url : undefined
        const bio: string | undefined = typeof p?.description === "string" ? p.description : undefined
        const location: string | undefined = typeof p?.location === "string" ? p.location : undefined
        const website: string | undefined = typeof p?.url === "string" ? p.url : undefined
        const joinDate: string | undefined = typeof p?.created_at === "string" ? p.created_at : undefined

        if (username) (token as any).username = username
        if (typeof tweetCount === "number") (token as any).tweetCount = tweetCount
        if (typeof isVerified === "boolean") (token as any).isVerified = isVerified
        if (profileImage) (token as any).profileImage = profileImage
        if (bannerImage) (token as any).bannerImage = bannerImage
        if (bio) (token as any).bio = bio
        if (location) (token as any).location = location
        if (website) (token as any).website = website
        if (joinDate) (token as any).joinDate = joinDate
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Only propagate fields that exist on the token.
        const t = token as any
        if (t?.username) (session.user as any).username = t.username
        if (typeof t?.tweetCount === "number") (session.user as any).tweetCount = t.tweetCount
        if (typeof t?.isVerified === "boolean") (session.user as any).isVerified = t.isVerified
        if (t?.profileImage) (session.user as any).profileImage = t.profileImage
        if (t?.bannerImage) (session.user as any).bannerImage = t.bannerImage
        if (t?.bio) (session.user as any).bio = t.bio
        if (t?.location) (session.user as any).location = t.location
        if (t?.website) (session.user as any).website = t.website
        if (t?.joinDate) (session.user as any).joinDate = t.joinDate
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "demo-secret-key",
  debug: process.env.NODE_ENV === "development",
}
