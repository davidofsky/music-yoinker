import { FaDownload } from 'react-icons/fa'
import axios from "axios"
import { Modal, Button, Typography, Listy } from "antd"
import { OpenAlbumCtx } from "@/app/context"
import { useContext, useState } from "react"

const { Title, Text } = Typography

const AlbumViewer = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!
  const [isDownloading, setIsDownloading] = useState(false)

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
          <Text type="secondary">{openAlbum?.Artist}</Text>
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
            <div style={{ padding: '8px 0' }}>{i + 1}. {t.title}</div>
          )}
        />
      </div>
    </Modal>
  )
}

export default AlbumViewer
