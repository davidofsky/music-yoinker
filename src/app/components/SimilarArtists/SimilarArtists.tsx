"use client"
import { useRouter } from "next/navigation"
import { Flex, Tag, Tooltip, Typography } from "antd"
import type { DiscoverArtist } from "@/lib/discovery"

// Each tag runs the normal artist search.
const SimilarArtists = ({ artists }: { artists: DiscoverArtist[] }) => {
  const router = useRouter()
  if (artists.length === 0) return null

  return (
    <Flex vertical gap="small">
      <Typography.Title level={4} style={{ margin: 0, textAlign: 'center' }}>Artists you might like</Typography.Title>
      <Flex wrap justify="center" gap="small">
        {artists.map(a => (
          <Tag key={a.name}
            style={{ cursor: 'pointer', fontSize: 14, padding: '4px 10px', margin: 0 }}
            onClick={() => router.push(`/?${new URLSearchParams({ q: a.name, mode: 'artists' })}`)}
          >
            {a.name}
          </Tag>
        ))}
      </Flex>
    </Flex>
  )
}

export default SimilarArtists
