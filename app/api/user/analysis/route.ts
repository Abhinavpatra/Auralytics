import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserAnalysis } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id || session.user.email
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
    }

    // Check if user has existing analysis
    const existingAnalysis = await getUserAnalysis(userId)
    
    if (existingAnalysis) {
      return NextResponse.json({
        hasAnalysis: true,
        analysis: existingAnalysis.analysis,
        userData: existingAnalysis.userData,
        lastUpdated: existingAnalysis.updatedAt
      })
    }

    return NextResponse.json({
      hasAnalysis: false
    })
    
  } catch (error) {
    console.error('Error checking user analysis:', error)
    return NextResponse.json({ 
      error: 'Failed to check analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
