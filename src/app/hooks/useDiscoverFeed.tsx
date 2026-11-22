import { useCallback, useContext, useEffect, useState } from "react"
import axios from "axios"
import { LoadingCtx } from "@/app/context"
import type { DiscoverFeed, DiscoverPeriod } from "@/lib/discovery"

// Suggestions for `period`. The server caches them 6h; reload(true) rebuilds.
export const useDiscoverFeed = (username: string | null | undefined, period: DiscoverPeriod) => {
  const [, setLoading] = useContext(LoadingCtx)!
  const [feed, setFeed] = useState<DiscoverFeed | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p: DiscoverPeriod, refresh = false) => {
    setLoading(true)
    setError(null)
    setFeed(null)
    try {
      const result = await axios.get<DiscoverFeed>('/api/discover', { params: { period: p, refresh: refresh ? 1 : undefined } })
      setFeed(result.data)
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 401
        ? 'Your Last.fm session has expired. Connect again.'
        : 'Could not build your discovery feed. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  useEffect(() => {
    if (username) load(period)
  }, [username, period, load])

  const reload = useCallback((refresh = false) => load(period, refresh), [load, period])

  return { feed, error, reload }
}
