"use client"
import { FaTasks, FaHourglass, FaDownload, FaTrash } from 'react-icons/fa'
import { useWebSocket } from "../../hooks/useWebsocket";
import { useContext, useEffect, useState } from 'react';
import { Track } from '@/lib/interfaces';
import axios from 'axios';
import { FaXmark } from 'react-icons/fa6';
import { AnimatePresence, motion } from 'motion/react'
import { LoadingCtx, OpenAlbumCtx, OpenArtistCtx, OpenQueueCtx } from '@/app/context';

import "./Queue.css"

const Queue = () => {
  const [openQueue, setOpenQueue] = useContext(OpenQueueCtx)!;
  const [loading] = useContext(LoadingCtx)!;
  const [openAlbum] = useContext(OpenAlbumCtx)!;
  const [openArtist] = useContext(OpenArtistCtx)!;

  const { lastMessage } = useWebSocket('/api/ws');

  const [queueList, setQueueList] = useState<Track[]>([]);
  const [currentDownload, setCurrentDownload] = useState<string|null>(null);

  useEffect(() => {
    axios.get("/api/queue").then(result => {
      const tracks = (result.data as never) as Track[];
      processTracks(tracks);
    })
  }, [])

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type==="queue") {
      const tracks = JSON.parse(lastMessage.message) as Track[]
      processTracks(tracks);
    }
  }, [lastMessage])

  const processTracks = (tracks: Track[]) => {
    if (tracks.length>0) setCurrentDownload(tracks[0].title);
    else setCurrentDownload(null);
    setQueueList(tracks);
  }

  const removeTrack = async (trackId: string) => {
    await axios.delete("/api/track", {
      params: { id: trackId }
    })
  }

  return (
    <>
    <AnimatePresence>
    {openQueue && 
      <motion.div className='ModalBackground'
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        exit=   {{ opacity: 0 }}
        onClick={ () => setOpenQueue(false) }> 

        <motion.div className='Modal'
          initial={{ opacity: 0, scale:.8 }} 
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: {
              default: {type: "tween"},
              opacity: {ease: "linear"}
            }
          }}
          exit=   {{ opacity: 0, scale: .8 }}
          onClick={(e) => e.stopPropagation()}> 
          Download queue
          <div className='QueuedList'>
            {queueList?.map((track, i) => {
              return (
                <div className='QueuedItem' key={i}>
                  {i === 0 && 
                    <FaDownload/>
                    ||
                    <FaHourglass/>
                  }
                  <p>
                    {track.title}
                  </p>
                  {i > 0 && <FaTrash className='CancelQueue' 
                    onClick={() => removeTrack(track.id)}/> }
                </div>
              )
            })}
            </div>
            <div className='ModalFooter'>
            <button 
              className="HoverButtonRed"
              onClick={() => setOpenQueue(false)}>
              <FaXmark/>
              Close page
            </button>
            </div>
        </motion.div> 
      </motion.div> 
    }
    </AnimatePresence>

    <div className={`Queue ${loading||openAlbum||openQueue||openArtist?'blur':''}`} onClick={ () => setOpenQueue(true) }>
      <FaTasks/> 
      {currentDownload && 
        <p>{currentDownload}</p>
        ||
        <p>Queue is empty</p>
      }
    </div>
    </>
  )
}

export default Queue;
