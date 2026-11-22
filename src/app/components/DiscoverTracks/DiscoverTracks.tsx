"use client"
import { Button, Empty, Flex, Typography } from "antd"
import MediaGrid from "../MediaGrid/MediaGrid"
import type { MatchedSuggestion } from "@/app/hooks/useDiscoverMatches"

type Props = {
  // Suggestions in the feed, matched or not.
  total: number
  shown: MatchedSuggestion[]
  matching: boolean
  hasMore: boolean
  onLoadMore: () => void
}

// "Tracks for you": suggestions found on Tidal/Qobuz.
const DiscoverTracks = ({ total, shown, matching, hasMore, onLoadMore }: Props) => (
  <Flex vertical gap="small">
    <Typography.Title level={4} style={{ margin: 0, textAlign: 'center' }}>Tracks for you</Typography.Title>
    {total === 0 ? (
      <Empty description="Not enough listening history for this period yet. Try a longer one." />
    ) : (
      <MediaGrid
        kind="track"
        items={shown.map(s => s.track)}
        subtitles={shown.map(s => `Because you listen to ${s.suggestion.because}`)}
        // Downloaded suggestions are already left out.
        onDownloadsFinished={() => {}}
      />
    )}
    {(hasMore || matching) && (
      <Flex justify="center">
        <Button loading={matching} onClick={onLoadMore}>Load more</Button>
      </Flex>
    )}
    {!hasMore && !matching && total > 0 && shown.length === 0 && (
      <Empty description="None of the suggestions could be found on your sources, or they're all in your library already." />
    )}
  </Flex>
)

export default DiscoverTracks
