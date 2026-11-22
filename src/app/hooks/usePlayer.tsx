"use client"
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ITrack } from "../interfaces/track.interface";

interface PlayerState {
  track: ITrack | null;
  playing: boolean;
  loading: boolean;
  error: boolean;
  currentTime: number;
  duration: number;
  // Toggles pause if `track` is already playing.
  play: (track: ITrack) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  stop: () => void;
}

const PlayerCtx = createContext<PlayerState | undefined>(undefined);

// One <audio> for the app, so playback survives page changes.
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<ITrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = useCallback((next: ITrack) => {
    const el = audio.current;
    if (!el) return;
    if (track && track.id === next.id && track.source === next.source) {
      if (el.paused) el.play().catch(() => setError(true)); else el.pause();
      return;
    }
    setTrack(next);
    setError(false);
    setCurrentTime(0);
    setDuration(next.duration || 0);
    setLoading(true);
    el.src = `/api/preview?${new URLSearchParams({ id: String(next.id), source: next.source ?? '' })}`;
    el.play().catch(() => { /* reported through the error event */ });
  }, [track]);

  const toggle = useCallback(() => {
    const el = audio.current;
    if (!el || !track) return;
    if (el.paused) el.play().catch(() => setError(true)); else el.pause();
  }, [track]);

  const seek = useCallback((seconds: number) => {
    if (audio.current) audio.current.currentTime = seconds;
  }, []);

  const stop = useCallback(() => {
    const el = audio.current;
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    }
    setTrack(null);
    setPlaying(false);
    setLoading(false);
  }, []);

  // Media keys and the lock screen.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist?.name,
      album: track.album?.title,
      artwork: track.artwork ? [{ src: track.artwork }] : [],
    });
    navigator.mediaSession.setActionHandler('play', toggle);
    navigator.mediaSession.setActionHandler('pause', toggle);
  }, [track, toggle]);

  return (
    <PlayerCtx.Provider value={{ track, playing, loading, error, currentTime, duration, play, toggle, seek, stop }}>
      {children}
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => { setLoading(false); setError(false); }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onError={() => { if (audio.current?.getAttribute('src')) { setError(true); setLoading(false); setPlaying(false); } }}
      />
    </PlayerCtx.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}

// Is `track` the one currently playing?
export function useIsPlaying() {
  const { track, playing } = usePlayer();
  return (t: ITrack) => playing && !!track && track.id === t.id && track.source === t.source;
}
