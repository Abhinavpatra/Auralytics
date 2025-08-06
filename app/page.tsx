import { WaitingPage } from '@/components/waiting-page'
import { Suspense } from 'react'

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WaitingPage/>
    </Suspense>
  )
}
