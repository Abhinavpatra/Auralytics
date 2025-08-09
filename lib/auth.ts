import type { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"

/**
 * NextAuth configuration:
 * - No database usage.
 * - Adds username from the X/Twitter profile to the JWT and then to session.user.
 * - Requests scopes so the profile includes username (when supported).
 */
export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      version: "2.0",
      // Ask for standard read scopes; provider may ignore if already defaulted.
      // The Twitter provider accepts extra params via `authorization` option.
      // Casting to any to avoid provider type friction across versions.
      ...({
        authorization: {
          params: {
            scope: "tweet.read users.read offline.access",
          },
        },
      } as any),
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile, account }) {
      // Preserve an existing username if already set.
      if (!token.username) {
        // Try multiple fields from various Twitter payloads
        const p = profile as any
        token.username = p?.username || p?.screen_name || p?.data?.username || p?.login || null
      }

      // Optional: carry extra public profile attributes if present
      if (!token.name && profile?.name) token.name = profile.name
      if (!token.picture && (profile as any)?.profile_image_url) {
        token.picture = (profile as any).profile_image_url
      }

      // Keep provider info if you need it for future conditionals
      if (account?.provider) token.provider = account.provider

      return token
    },
    async session({ session, token }) {
      // Expose username on session.user so the rest of the app can read it easily
      ;(session.user as any).username = (token as any)?.username || null
      // Preserve picture/name if carried in the token
      if (token?.picture) session.user.image = token.picture as string
      if (token?.name && !session.user.name) session.user.name = token.name as string
      return session
    },
  },
}
