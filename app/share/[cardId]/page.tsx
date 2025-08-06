import { ShareCard } from '@/components/share-card'
import { Metadata } from 'next'

interface Props {
  params: { cardId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // In a real app, fetch card data from database
  const cardData = {
    handle: '@example',
    auraScore: 87,
    tierName: 'Digital Wizard',
    dominantTopic: 'AI & Tech'
  }

  return {
    title: `${cardData.handle}'s Aura Card - ${cardData.auraScore} (${cardData.tierName})`,
    description: `Check out ${cardData.handle}'s digital aura analysis!`,
    openGraph: {
      title: `${cardData.handle}'s Aura Card`,
      description: `Aura Score: ${cardData.auraScore} - ${cardData.tierName}`,
      images: [`/api/og/${params.cardId}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cardData.handle}'s Aura Card`,
      description: `Aura Score: ${cardData.auraScore} - ${cardData.tierName}`,
      images: [`/api/og/${params.cardId}`],
    },
  }
}

export default function SharePage({ params }: Props) {
  return <ShareCard cardId={params.cardId} />
}
