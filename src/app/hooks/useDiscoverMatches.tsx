import { useCallback, useEffect, useRef, useState } from "react"
import axios from "axios"
import { ITrack } from "@/app/interfaces/track.interface"
import type { DiscoverFeed, DiscoverTrack, MatchResult } from "@/lib/discovery"
import { getMatch, matchKey, saveMatches } from "@/app/utils/matchStore"

// One search per suggestion; Qobuz allows only a few a minute.
const MATCH_BATCH = 10

// A suggestion found on Tidal/Qobuz.
export type MatchedSuggestion = { suggestion: DiscoverTrack; track: ITrack }

// Saved matches first, searches the rest. null = not found or failed.
async function matchTracks(batch: DiscoverTrack[]): Promise<(ITrack | null)[]> {
  const keys = batch.map(matchKey)
  const tracks = keys.map(getMatch)

  const unknown = batch.flatMap((s, i) => (tracks[i] === undefined ? [i] : []))
  const remembered = tracks.flatMap((t, i) => (t ? [i] : []))

  const [searched, inLibrary] = await Promise.all([
    unknown.length
      ? axios.post<MatchResult[]>('/api/discover/match', unknown.map(i => ({ artist: batch[i].artist, title: batch[i].title }))).then(r => r.data)
      : [],
    remembered.length
      ? axios.post<boolean[]>('/api/discover/library', remembered.map(i => tracks[i])).then(r => r.data)
      : [],
  ])

  remembered.forEach((i, n) => { tracks[i] = { ...tracks[i]!, isDownloaded: inLibrary[n] } })

  const toSave: { key: string; track: ITrack | null }[] = []
  unknown.forEach((i, n) => {
    const r = searched[n]
    if (r?.status === 'found') {
      tracks[i] = r.track
      toSave.push({ key: keys[i], track: r.track })
    } else {
      tracks[i] = null
      if (r?.status === 'missing') toSave.push({ key: keys[i], track: null }) // don't save failures
    }
  })
  saveMatches(toSave)

  return tracks.map(t => t ?? null)
}

// Matches the first batch per feed, the rest on loadMore().
export const useDiscoverMatches = (feed: DiscoverFeed | null) => {
  const [shown, setShown] = useState<MatchedSuggestion[]>([])
  const [matchedUpTo, setMatchedUpTo] = useState(0)
  const [matching, setMatching] = useState(false)
  const feedRef = useRef<DiscoverFeed | null>(null)

  const matchBatch = useCallback(async (current: DiscoverFeed, start: number) => {
    const batch = current.tracks.slice(start, start + MATCH_BATCH)
    if (batch.length === 0) return
    setMatching(true)
    try {
      const tracks = await matchTracks(batch)
      if (feedRef.current !== current) return // period changed meanwhile
      const found = batch.flatMap((suggestion, i) => {
        const track = tracks[i]
        return track && !track.isDownloaded ? [{ suggestion, track }] : []
      })
      setShown(prev => [...prev, ...found])
      setMatchedUpTo(start + batch.length)
    } catch (err) {
      console.error('Matching failed:', err)
    } finally {
      if (feedRef.current === current) setMatching(false)
    }
  }, [])

  // Once per feed, even when dev runs effects twice.
  useEffect(() => {
    if (feedRef.current === feed) return
    feedRef.current = feed
    setShown([])
    setMatchedUpTo(0)
    setMatching(false)
    if (feed) matchBatch(feed, 0)
  }, [feed, matchBatch])

  const loadMore = () => {
    if (feed && !matching) matchBatch(feed, matchedUpTo)
  }

  const hasMore = !!feed && matchedUpTo < feed.tracks.length

  return { shown, matching, hasMore, loadMore }
}
