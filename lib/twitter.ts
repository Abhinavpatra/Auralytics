interface TwitterUser {
  id: string
  username: string
  name: string
  public_metrics: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
}

interface TwitterTweet {
  id: string
  text: string
  created_at: string
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
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  }

  async getUserTweets(userId: string, maxResults: number = 100): Promise<TwitterTweet[]> {
    const response = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics&exclude=retweets,replies`,
      {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  }
}
