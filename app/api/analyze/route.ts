import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { saveUserAnalysis } from '../../lib/gemini';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  const sessionUser = (session?.user as any) || undefined;

  if (!sessionUser || !sessionUser.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { username, tweetCount, profileImage, location, website, joinDate, isVerified } = req.body;

  let analysis: any = {};

  if (sessionUser.premium) {
    // Premium path: Fetch detailed user data from Twitter API
    const userResponse = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_API_TOKEN}`,
      },
    });

    const user = await userResponse.json();

    analysis.userData = {
      username,
      bio: user.data.description,
      tweetCount: user.data.public_metrics?.tweet_count ?? tweetCount ?? undefined,
      profileImage: user.data.profile_image_url || profileImage || '',
      location,
      website,
      joinDate: user.data.created_at || joinDate || '',
      isVerified: typeof user.data.verified === 'boolean' ? user.data.verified : isVerified,
      followersCount: typeof user.data.public_metrics?.followers_count === 'number'
        ? user.data.public_metrics.followers_count
        : undefined,
      followingCount: typeof user.data.public_metrics?.following_count === 'number'
        ? user.data.public_metrics.following_count
        : undefined,
    };

    await saveUserAnalysis({
      userId: sessionUser.id,
      userData: {
        username,
        bio: analysis.userData.bio,
        tweetCount: analysis.userData.tweetCount,
        profileImage: analysis.userData.profileImage,
        location,
        website,
        joinDate: analysis.userData.joinDate,
        isVerified: analysis.userData.isVerified,
        followersCount: analysis.userData.followersCount,
        followingCount: analysis.userData.followingCount,
      },
      analysisData: analysis,
    });
  } else {
    // Non-premium path: Use basic user data
    analysis.userData = {
      username,
      tweetCount,
      profileImage,
      location,
      website,
      joinDate,
      isVerified,
    };

    await saveUserAnalysis({
      userId: sessionUser.id,
      userData: analysis.userData,
      analysisData: analysis,
    });
  }

  res.status(200).json({ analysis });
}
