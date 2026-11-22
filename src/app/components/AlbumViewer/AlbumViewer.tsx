import { FaDownload, FaPause, FaPlay } from 'react-icons/fa'
import axios from "axios"
import { Modal, Button, Flex, Typography, Listy } from "antd"
import { OpenAlbumCtx } from "@/app/context"
import { useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { useIsPlaying, usePlayer } from "@/app/hooks/usePlayer"

const { Title, Text } = Typography

const AlbumViewer = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!
  const [isDownloading, setIsDownloading] = useState(false)
  const { play } = usePlayer()
  const isPlaying = useIsPlaying()
  const router = useRouter()

  const closeAction = () => setOpenAlbum(null);

  const downloadAlbum = async () => {
    try {
      setIsDownloading(true)
      await axios.post('/api/tracks', openAlbum?.Tracks, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error(`Failed to download album: ${error}`);
      // Optionally show error to user
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Modal
      open={!!openAlbum}
      onCancel={closeAction}
      title={
        <>
          <Title level={4} style={{ margin: 0 }}>
            {openAlbum?.Title} {openAlbum?.ReleaseDate && `(${openAlbum.ReleaseDate.split("-")[0]})`}
          </Title>
          {openAlbum?.ArtistId ? (
            <Typography.Link
              type="secondary"
              onClick={() => {
                const { ArtistId, Source } = openAlbum
                closeAction()
                router.push(Source ? `/artist/${ArtistId}?source=${Source}` : `/artist/${ArtistId}`)
              }}
            >
              {openAlbum.Artist}
            </Typography.Link>
          ) : (
            <Text type="secondary">{openAlbum?.Artist}</Text>
          )}
        </>
      }
      footer={[
        <Button key="close" danger onClick={closeAction} disabled={isDownloading}>
          Close
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<FaDownload />}
          loading={isDownloading}
          onClick={() => {
            downloadAlbum();
            closeAction();
          }}
        >
          {isDownloading ? 'Adding...' : 'Add to library'}
        </Button>,
      ]}
    >
      <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        <Listy
          virtual={false}
          items={openAlbum?.Tracks ?? []}
          rowKey={(t) => t.id}
          itemRender={(t, i) => (
            <Flex align="center" gap="small" style={{ padding: '4px 0' }}>
              <Button
                type="text"
                shape="circle"
                aria-label={isPlaying(t) ? `Pause ${t.title}` : `Play ${t.title}`}
                icon={isPlaying(t) ? <FaPause /> : <FaPlay />}
                onClick={() => play(t)}
              />
              <span>{i + 1}. {t.title}</span>
            </Flex>
          )}
        />
      </div>
    </Modal>
  )
}

export default AlbumViewer
