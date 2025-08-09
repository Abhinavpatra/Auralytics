import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  // In a real app, fetch card data from database using cardId
  const cardData = {
    handle: '@example',
    auraScore: 87,
    tierName: 'Digital Wizard',
    dominantTopic: 'AI & Tech',
    sentiment: 'Positive',
    engagement: 'High'
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'black', // Consistent with dark mode background
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255,255,255,0.2) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          fontFamily: 'Inter', // Using Inter font
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Neon border effect - Neobrutalist style */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            border: '4px solid #00ff88', // Neo-primary color
            borderRadius: '0px', // Sharp corners
            boxShadow: '8px 8px 0px 0px black', // Hard shadow
          }}
        />
        
        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#00ff88', // Neo-primary color
            }}
          >
            AURA CARD
          </div>
          
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '10px',
            }}
          >
            {cardData.handle}
          </div>
          
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#00ff88', // Neo-primary color
              marginBottom: '10px',
            }}
          >
            {cardData.auraScore}
          </div>
          
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '30px',
              color: '#ff6b6b', // Neo-secondary color
            }}
          >
            {cardData.tierName}
          </div>
          
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                padding: '10px 20px',
                backgroundColor: 'black', // Consistent with dark mode
                border: '2px solid #00ff88', // Neo-primary border
                borderRadius: '0px', // Sharp corners
                fontSize: '18px',
                boxShadow: '4px 4px 0px 0px white', // Hard shadow
              }}
            >
              {cardData.dominantTopic}
            </div>
            <div
              style={{
                padding: '10px 20px',
                backgroundColor: 'black', // Consistent with dark mode
                border: '2px solid #ff6b6b', // Neo-secondary border
                borderRadius: '0px', // Sharp corners
                fontSize: '18px',
                boxShadow: '4px 4px 0px 0px white', // Hard shadow
              }}
            >
              {cardData.sentiment}
            </div>
          </div>
          
          <div
            style={{
              fontSize: '20px',
              color: '#888',
            }}
          >
            Get your Aura Card at aura.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
