"use client"
import { useSearchParams } from "next/navigation"
import { Alert, Button, Flex, Result } from "antd"
import { FaLastfm } from "react-icons/fa"

// Shown until Last.fm is connected, or when it isn't configured.
const LastFmConnect = ({ enabled }: { enabled: boolean }) => {
  const searchParams = useSearchParams()

  if (!enabled) {
    return <Result status="info" title="Last.fm isn't configured" />
  }

  return (
    <Result
      icon={<FaLastfm size={64} color="#d51007" />}
      title="Discover new music"
      subTitle="Connect your Last.fm account."
      extra={
        <Flex vertical align="center" gap="middle">
          {searchParams.get('lastfm') === 'error' && (
            <Alert type="error" showIcon message="Connecting to Last.fm failed. Please try again." />
          )}
          <Button type="primary" size="large" icon={<FaLastfm />} href="/api/lastfm/login">
            Connect Last.fm
          </Button>
        </Flex>
      }
    />
  )
}

export default LastFmConnect
