"use client"
import { Suspense, useState } from "react"
import { Button, Flex, Layout, Result, Spin } from "antd"
import { GRID_CONTENT_STYLE } from "@/app/components/MediaGrid/MediaGrid"
import DiscoverHeader from "@/app/components/DiscoverHeader/DiscoverHeader"
import LastFmConnect from "@/app/components/LastFmConnect/LastFmConnect"
import SimilarArtists from "@/app/components/SimilarArtists/SimilarArtists"
import DiscoverTracks from "@/app/components/DiscoverTracks/DiscoverTracks"
import { useLastFm } from "@/app/hooks/useLastFm"
import { useDiscoverFeed } from "@/app/hooks/useDiscoverFeed"
import { useDiscoverMatches } from "@/app/hooks/useDiscoverMatches"
import type { DiscoverPeriod } from "@/lib/discovery"

const DiscoverView = () => {
  const lastFm = useLastFm()
  const [period, setPeriod] = useState<DiscoverPeriod>('1month')
  const { feed, error, reload } = useDiscoverFeed(lastFm?.username, period)
  const { shown, matching, hasMore, loadMore } = useDiscoverMatches(feed)

  const body = (() => {
    if (!lastFm) return <Spin />
    if (!lastFm.username) return <LastFmConnect enabled={lastFm.enabled} />
    if (error) return <Result status="warning" title={error} extra={<Button onClick={() => reload(true)}>Try again</Button>} />
    if (!feed) return null

    return (
      <Flex vertical gap="large" style={{ width: '100%', maxWidth: 1240 }}>
        <SimilarArtists artists={feed.artists} />
        <DiscoverTracks
          total={feed.tracks.length}
          shown={shown}
          matching={matching}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </Flex>
    )
  })()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <DiscoverHeader username={lastFm?.username} period={period} onPeriodChange={setPeriod} />
      <Layout.Content style={GRID_CONTENT_STYLE}>{body}</Layout.Content>
    </Layout>
  )
}

// useSearchParams in LastFmConnect needs Suspense for the build.
const DiscoverPage = () => (
  <Suspense>
    <DiscoverView />
  </Suspense>
)

export default DiscoverPage
