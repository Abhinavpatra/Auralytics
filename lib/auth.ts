import { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'

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
        token.username = (profile as any).username || ''
        token.followers = (profile as any).public_metrics?.followers_count || Math.floor(Math.random() * 5000)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).username = token.username
        ;(session.user as any).followers = token.followers
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'demo-secret-key',
}
