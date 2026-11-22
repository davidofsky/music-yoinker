import { useEffect, useState } from "react"
import axios from "axios"

export type LastFmStatus = { enabled: boolean; username: string | null }

// Last.fm config and connected user; null while loading.
export const useLastFm = (): LastFmStatus | null => {
  const [status, setStatus] = useState<LastFmStatus | null>(null)

  useEffect(() => {
    axios.get<LastFmStatus>('/api/lastfm/me')
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ enabled: false, username: null }))
  }, [])

  return status
}
