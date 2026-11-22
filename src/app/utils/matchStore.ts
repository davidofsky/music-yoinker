import { ITrack } from "@/app/interfaces/track.interface"

// Discover matches in localStorage, so each suggestion is searched once.

const STORAGE_KEY = 'discover-matches'
const MAX_ENTRIES = 5000 // ~1 KB each
const MISSING_TTL_MS = 7 * 24 * 60 * 60 * 1000 // retry "not found" after a week

type Entry = { at: number; track: ITrack | null }
type Store = Record<string, Entry>

export const matchKey = (s: { artist: string; title: string }) => `${s.artist.toLowerCase()}|${s.title.toLowerCase()}`

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

// Track, null for "not found", undefined when it needs a search.
export function getMatch(key: string): ITrack | null | undefined {
  const entry = read()[key]
  if (!entry) return undefined
  if (!entry.track && Date.now() - entry.at > MISSING_TTL_MS) return undefined
  return entry.track
}

export function saveMatches(results: { key: string; track: ITrack | null }[]) {
  if (results.length === 0) return
  const store = read()
  for (const { key, track } of results) store[key] = { at: Date.now(), track }

  // Drop the oldest beyond the limit.
  const keys = Object.keys(store)
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a, b) => store[a].at - store[b].at)
    for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) delete store[k]
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch { /* full or unavailable: next time it is searched again */ }
}
