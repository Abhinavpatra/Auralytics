import { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import { updateUserProfile } from './mongodb' // Still using the same interface, but now it's in-memory

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || 'demo-client-id',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || 'demo-client-secret',
      version: '2.0',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Extract user data from Twitter profile
        const twitterProfile = profile as any
        
        // Get real user data from Twitter
        const username = twitterProfile.username || twitterProfile.screen_name || 'demo_user'
        const tweetCount = twitterProfile.public_metrics?.tweet_count || 0
        const isVerified = twitterProfile.verified || false
        const profileImage = twitterProfile.profile_image_url || ''
        const bannerImage = twitterProfile.profile_banner_url || ''
        const bio = twitterProfile.description || ''
        const location = twitterProfile.location || ''
        const website = twitterProfile.url || ''
        const joinDate = twitterProfile.created_at || new Date().toISOString()
        
        // Store in token
        token.username = username
        token.tweetCount = tweetCount
        token.isVerified = isVerified
        token.profileImage = profileImage
        token.bannerImage = bannerImage
        token.bio = bio
        token.location = location
        token.website = website
        token.joinDate = joinDate
        
        // Store user profile in memory
        try {
          await updateUserProfile(token.sub!, {
            tweetCount,
            profileImage,
            bio,
            location,
            website,
            joinDate,
            isVerified
          });
        } catch (error) {
          console.error('Failed to update user profile:', error);
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).username = token.username
        ;(session.user as any).tweetCount = token.tweetCount
        ;(session.user as any).isVerified = token.isVerified
        ;(session.user as any).profileImage = token.profileImage
        ;(session.user as any).bannerImage = token.bannerImage
        ;(session.user as any).bio = token.bio
        ;(session.user as any).location = token.location
        ;(session.user as any).website = token.website
        ;(session.user as any).joinDate = token.joinDate
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'demo-secret-key',
  debug: process.env.NODE_ENV === 'development',
}
