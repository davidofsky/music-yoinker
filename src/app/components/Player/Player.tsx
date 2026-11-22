"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Button, Flex, Slider, Typography, theme } from "antd";
import { FaDownload, FaPause, FaPlay, FaTimes } from "react-icons/fa";
import { usePlayer } from "@/app/hooks/usePlayer";
import { useQueue } from "@/app/hooks/useQueue";

const { Text } = Typography;

const PLAYER_HEIGHT = 96;

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

// Player bar at the bottom of every page.
const Player = () => {
  const { token } = theme.useToken();
  const { track, playing, loading, error, currentTime, duration, toggle, seek, stop } = usePlayer();
  const queue = useQueue();
  const [adding, setAdding] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);

  // Lets fixed bottom elements (queue button) stay clear of the bar.
  const visible = !!track;
  useEffect(() => {
    if (!visible) return;
    document.documentElement.style.setProperty('--player-height', `${PLAYER_HEIGHT}px`);
    return () => { document.documentElement.style.removeProperty('--player-height'); };
  }, [visible]);

  if (!track) return null;

  const inQueue = queue.some(t => t.id === track.id && t.source === track.source);
  const addToLibrary = async () => {
    setAdding(true);
    try {
      await axios.post('/api/tracks', [track]);
    } catch (err) {
      console.error('Failed to add to library:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {/* Keeps the page end from hiding behind the bar */}
      <div style={{ height: PLAYER_HEIGHT }} />
      <Flex
        vertical
        justify="center"
        gap={4}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 900,
          height: PLAYER_HEIGHT, padding: '8px 16px',
          background: token.colorBgElevated,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <Flex align="center" gap="middle">
          {track.artwork && (
            <Image src={track.artwork} alt="" width={48} height={48} style={{ borderRadius: 6, flexShrink: 0 }} />
          )}
          <Flex vertical style={{ minWidth: 0, flex: 1 }}>
            <Text strong ellipsis>{track.title}</Text>
            <Text type={error ? 'danger' : 'secondary'} ellipsis>
              {error ? 'Could not play this track' : track.artist?.name}
            </Text>
          </Flex>
          <Button
            shape="circle"
            type="primary"
            size="large"
            aria-label={playing ? 'Pause' : 'Play'}
            loading={loading && !error}
            icon={playing ? <FaPause /> : <FaPlay />}
            onClick={toggle}
          />
          <Button
            icon={<FaDownload />}
            loading={adding}
            disabled={track.isDownloaded || inQueue}
            onClick={addToLibrary}
            title="Add to library"
          >
            <span className="player-add-label">
              {track.isDownloaded ? 'In library' : inQueue ? 'Queued' : 'Add to library'}
            </span>
          </Button>
          <Button type="text" aria-label="Close player" icon={<FaTimes />} onClick={stop} />
        </Flex>
        <Flex align="center" gap="small">
          <Text type="secondary" style={{ fontSize: 12, width: 36, textAlign: 'right' }}>{formatTime(scrub ?? currentTime)}</Text>
          <Slider
            style={{ flex: 1, margin: '0 4px' }}
            min={0}
            max={Math.max(duration, 1)}
            step={1}
            value={scrub ?? currentTime}
            tooltip={{ formatter: (v) => formatTime(v ?? 0) }}
            onChange={setScrub}
            onChangeComplete={(v) => { seek(v); setScrub(null); }}
          />
          <Text type="secondary" style={{ fontSize: 12, width: 36 }}>{formatTime(duration)}</Text>
        </Flex>
      </Flex>
    </>
  );
};

export default Player;
