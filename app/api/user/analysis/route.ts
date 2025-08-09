import { type NextRequest, NextResponse } from "next/server"

// This endpoint is intentionally disabled because the app is stateless (no DB).
// Returning 410 Gone to signal to any callers it no longer exists.
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: "Gone" }, { status: 410 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: "Gone" }, { status: 410 })
}

// export async function GET(request: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions)

//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     const userId = (session.user as any).id || session.user.email

//     if (!userId) {
//       return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
//     }

//     // Check if user has existing analysis
//     const existingAnalysis = await getUserAnalysis(userId)

//     if (existingAnalysis) {
//       return NextResponse.json({
//         hasAnalysis: true,
//         analysis: existingAnalysis.analysis,
//         userData: existingAnalysis.userData,
//         lastUpdated: existingAnalysis.updatedAt
//       })
//     }

//     return NextResponse.json({
//       hasAnalysis: false
//     })

//   } catch (error) {
//     console.error('Error checking user analysis:', error)
//     return NextResponse.json({
//       error: 'Failed to check analysis',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 })
//   }
// }
