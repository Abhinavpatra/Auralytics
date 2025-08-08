import { Suspense } from 'react'
import { LandingPage } from '@/components/landing-page'
import { WaitingPage } from '@/components/waiting-page'

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPage />
      {/* <WaitingPage/> */}
    </Suspense>
  )
}
