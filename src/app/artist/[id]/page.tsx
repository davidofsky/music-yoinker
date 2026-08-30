"use client"
import { useContext, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import Image from "next/image"
import { Avatar, Button, Flex, Layout, Segmented, Typography } from "antd"
import { FaArrowLeft, FaUser } from "react-icons/fa"
import { LoadingCtx } from "@/app/context"
import { useOpenAlbum } from "@/app/hooks/useOpenAlbum"
import { albumToChromaItem, CHROMA_GRID_CONFIG, GRID_CONTENT_STYLE } from "@/app/utils/chromaMappers"
import ChromaGrid from "@/app/reactbits/ChromaGrid"
import { IAlbum } from "@/app/interfaces/album.interface"

const { Content } = Layout
const { Title } = Typography

const PORTRAIT_STYLE = {
  width: 192,
  height: 192,
  borderRadius: '50%',
  objectFit: 'cover' as const,
  border: '4px solid #333',
  boxShadow: '0 0 40px rgba(0,0,0,0.6)',
}

type ReleaseType = 'albums' | 'singles'

const ArtistPage = () => {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const source = searchParams.get('source')
  const router = useRouter()
  const [, setLoading] = useContext(LoadingCtx)!
  const { openAlbum } = useOpenAlbum()
  const [releaseType, setReleaseType] = useState<ReleaseType>('albums')
  const [releases, setReleases] = useState<Array<IAlbum>>([])
  const [name, setName] = useState('')
  const [picture, setPicture] = useState('')

  useEffect(() => {
    getArtistReleases(releaseType);
  }, [params.id, source, releaseType])

  const getArtistReleases = async (type: ReleaseType) => {
    setLoading(true)
    try {
      const result = await axios.get("/api/artist", {
        params: { id: params.id, type, source }
      })
      const fetchedReleases: IAlbum[] = result.data
      setReleases(fetchedReleases)
      const artist = fetchedReleases
        .flatMap(a => a.artists)
        .find(a => String(a.id) === params.id) ?? fetchedReleases[0]?.artists[0]
      if (artist) {
        setName(artist.name)
        setPicture(artist.picture)
      }
    } catch (error) {
      console.error("Failed to load artist:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        style={{
          position: 'relative',
          padding: '64px 32px 48px',
          ...(picture ? { backgroundImage: `url(${picture})`, backgroundSize: 'cover', backgroundPosition: 'center 20%' } : {}),
        }}
      >
        <Flex
          vertical
          align="center"
          gap="middle"
          style={{
            position: 'relative',
            padding: 32,
            borderRadius: 16,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Button
            style={{ position: 'absolute', top: 0, left: 0 }}
            icon={<FaArrowLeft />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          {picture ? (
            <Image style={PORTRAIT_STYLE} src={picture} alt={name} width={192} height={192} />
          ) : (
            <Avatar style={PORTRAIT_STYLE} size={192} icon={<FaUser />} />
          )}
          <Title style={{ color: '#fff', margin: 0, textAlign: 'center' }}>{name}</Title>
        </Flex>
      </div>

      <Flex vertical align="center" gap="middle" style={{ marginTop: '1em' }}>
        <Title level={3} style={{ margin: 0 }}>
          {releaseType === 'albums' ? 'Albums' : 'Singles'}
        </Title>
        <Segmented
          value={releaseType}
          onChange={(value) => setReleaseType(value as ReleaseType)}
          options={[
            { label: 'Albums', value: 'albums' },
            { label: 'Singles', value: 'singles' },
          ]}
        />
      </Flex>
      <Content style={GRID_CONTENT_STYLE}>
        <ChromaGrid
          items={releases.map(a => albumToChromaItem(a, openAlbum))}
          damping={CHROMA_GRID_CONFIG.damping}
          fadeOut={CHROMA_GRID_CONFIG.fadeOut}
          ease={CHROMA_GRID_CONFIG.ease}
          columns={CHROMA_GRID_CONFIG.columns}
        />
      </Content>
    </div>
  )
}

export default ArtistPage
