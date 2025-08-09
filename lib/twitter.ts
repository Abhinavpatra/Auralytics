interface TwitterUser {
  id: string
  username: string
  name: string
  description?: string
  verified?: boolean
  public_metrics: {
    tweet_count: number
    followers_count: number
    following_count: number
    listed_count?: number
  }
  created_at?: string
  profile_image_url?: string
}

interface TwitterTweet {
  id: string
  text: string
  created_at: string
  in_reply_to_user_id?: string
  public_metrics: {
    like_count: number
    retweet_count: number
    reply_count: number
    quote_count: number
  }
  author_id: string
}

export class TwitterAPI {
  private bearerToken: string

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken
  }

  async getUserByUsername(username: string): Promise<TwitterUser> {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,created_at,profile_image_url,description,verified`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data as TwitterUser
  }

  async getUserTweets(userId: string, maxResults = 100): Promise<TwitterTweet[]> {
    const limit = Math.min(Math.max(5, maxResults), 100)
    const response = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=${limit}&tweet.fields=created_at,public_metrics,in_reply_to_user_id`,
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data = await response.json()
    return (data.data as TwitterTweet[]) || []
  }
}

export type { TwitterUser, TwitterTweet }
