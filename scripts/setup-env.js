#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 Auralytics Environment Setup\n');
  
  const envPath = path.join(process.cwd(), '.env.local');
  const examplePath = path.join(process.cwd(), 'env.example');
  
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }
  
  console.log('Please provide the following information:\n');
  
  // Required variables
  const nextAuthUrl = await question('NEXTAUTH_URL (e.g., https://your-domain.com): ');
  const nextAuthSecret = await question('NEXTAUTH_SECRET (generate a random string): ');
  const twitterClientId = await question('TWITTER_CLIENT_ID: ');
  const twitterClientSecret = await question('TWITTER_CLIENT_SECRET: ');
  const geminiApiKey = await question('GOOGLE_GEMINI_API_KEY: ');
  const mongodbUri = await question('MONGODB_URI (MongoDB connection string): ');
  const mongodbDbName = await question('MONGODB_DB_NAME (default: auralytics): ') || 'auralytics';
  
  // Optional variables
  const twitterBearerToken = await question('TWITTER_BEARER_TOKEN (optional, press Enter to skip): ');
  const maxTweets = await question('MAX_TWEETS_ANALYSIS (default: 100): ') || '100';
  const useScraping = await question('USE_SCRAPING (true/false, default: true): ') || 'true';
  
  // Generate environment file content
  const envContent = `# NextAuth Configuration
NEXTAUTH_URL=${nextAuthUrl}
NEXTAUTH_SECRET=${nextAuthSecret}

# Twitter OAuth (for user authentication)
TWITTER_CLIENT_ID=${twitterClientId}
TWITTER_CLIENT_SECRET=${twitterClientSecret}

# Twitter API (for verified users - optional)
${twitterBearerToken ? `TWITTER_BEARER_TOKEN=${twitterBearerToken}` : '# TWITTER_BEARER_TOKEN=your-twitter-bearer-token'}

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=${geminiApiKey}

# MongoDB Database (for storing user analysis data)
MONGODB_URI=${mongodbUri}
MONGODB_DB_NAME=${mongodbDbName}

# Analysis Configuration
MAX_TWEETS_ANALYSIS=${maxTweets}
USE_SCRAPING=${useScraping}

# Database (if you want to store analysis results)
# DATABASE_URL=your-database-url

# Email (for notifications - optional)
# EMAIL_SERVER_HOST=smtp.gmail.com
# EMAIL_SERVER_PORT=587
# EMAIL_SERVER_USER=your-email@gmail.com
# EMAIL_SERVER_PASSWORD=your-app-password
# EMAIL_FROM=noreply@your-domain.com
`;

  // Write to .env.local
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment file created successfully!');
  console.log('📁 File location: .env.local');
  console.log('\nNext steps:');
  console.log('1. Review the .env.local file');
  console.log('2. Run: npm run dev');
  console.log('3. Open: http://localhost:3000');
  
  rl.close();
}

setupEnvironment().catch(console.error);
