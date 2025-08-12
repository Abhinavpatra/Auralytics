"use client"

import { useEffect, useState } from "react"

export function useVisitorCount() {
  const [count, setCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let hasIncremented = false

    const incrementAndGetCount = async () => {
      try {
        // First, get the current count
        const getResponse = await fetch("/api/visitor-count")
        const getData = await getResponse.json()
        setCount(getData.count)
        setIsLoading(false)

        // Then increment it (only once per session)
        const sessionKey = "auralytics_visited"
        const hasVisitedThisSession = sessionStorage.getItem(sessionKey)

        if (!hasVisitedThisSession && !hasIncremented) {
          hasIncremented = true
          sessionStorage.setItem(sessionKey, "true")

          const postResponse = await fetch("/api/visitor-count", {
            method: "POST",
          })
          const postData = await postResponse.json()
          setCount(postData.count)
        }
      } catch (error) {
        console.error("Error with visitor count:", error)
        setIsLoading(false)
        // Set a fallback count
        setCount(118)
      }
    }

    incrementAndGetCount()
  }, [])

  return { count, isLoading }
}
