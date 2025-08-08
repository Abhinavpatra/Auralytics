// In-memory store for user analyses
interface UserAnalysis {
  _id?: string;
  userId: string;
  username: string;
  analysis: {
    auraScore: number;
    tierName: string;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
      dominant: 'positive' | 'negative' | 'neutral';
    };
    personality: {
      traits: string[];
      dominantTrait: string;
      confidence: number;
    };
    topics: Array<{
      name: string;
      frequency: number;
      sentiment: number;
    }>;
    engagement: {
      avgLikes: number;
      avgRetweets: number;
      avgReplies: number;
      totalEngagement: number;
      engagementRate: number;
    };
    writingStyle: {
      tone: string;
      formality: number;
      emotiveness: number;
      clarity: number;
    };
    timePatterns: {
      mostActiveHour: number;
      mostActiveDay: string;
      postingFrequency: number;
    };
    viralPotential: {
      score: number;
      factors: string[];
    };
    summary: string;
    timeSeriesData: Array<{
      date: string;
      sentiment: number;
      engagement: number;
      auraScore: number;
    }>;
  };
  userData: {
    username: string;
    bio: string;
    tweetCount: number;
    profileImage: string;
    location: string;
    website: string;
    joinDate: string;
    isVerified: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store
const userAnalyses = new Map<string, UserAnalysis>();

// Mock database functions that work with in-memory store
export async function saveUserAnalysis(analysis: Omit<UserAnalysis, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const now = new Date();
    const existingAnalysis = userAnalyses.get(analysis.userId);
    
    if (existingAnalysis) {
      // Update existing
      userAnalyses.set(analysis.userId, {
        ...existingAnalysis,
        ...analysis,
        updatedAt: now
      });
    } else {
      // Create new
      userAnalyses.set(analysis.userId, {
        ...analysis,
        _id: Math.random().toString(36).substring(2, 15),
        createdAt: now,
        updatedAt: now
      });
    }
    console.log('✅ Analysis saved to memory');
  } catch (error) {
    console.error('❌ Failed to save analysis:', error);
  }
}

export async function getUserAnalysis(userId: string): Promise<UserAnalysis | null> {
  try {
    return userAnalyses.get(userId) || null;
  } catch (error) {
    console.error('❌ Failed to get user analysis:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, profileData: {
  bio: string;
  tweetCount: number;
  profileImage: string;
  location: string;
  website: string;
  joinDate: string;
  isVerified: boolean;
}): Promise<void> {
  try {
    const existingAnalysis = userAnalyses.get(userId);
    if (existingAnalysis) {
      userAnalyses.set(userId, {
        ...existingAnalysis,
        userData: {
          ...existingAnalysis.userData,
          ...profileData
        },
        updatedAt: new Date()
      });
      console.log('✅ User profile updated in memory');
    }
  } catch (error) {
    console.error('❌ Failed to update user profile:', error);
  }
}

// Export types for use in other files
export type { UserAnalysis };

// For backward compatibility
export default {
  saveUserAnalysis,
  getUserAnalysis,
  updateUserProfile
};
