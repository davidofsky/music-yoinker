"use client"
import { FaTasks, FaHourglass, FaDownload } from 'react-icons/fa'
import { useWebSocket } from "../../hooks/useWebsocket";
import { useContext, useEffect, useState } from 'react';
import { Album } from '@/lib/interfaces';
import axios from 'axios';
import { FaXmark } from 'react-icons/fa6';
import { AnimatePresence, motion } from 'motion/react'
import { LoadingCtx, OpenAlbumCtx, OpenQueueCtx } from '@/app/context';

import "./Queue.css"

const Queue = () => {
  const [openQueue, setOpenQueue] = useContext(OpenQueueCtx)!;
  const [loading] = useContext(LoadingCtx)!;
  const [openAlbum] = useContext(OpenAlbumCtx)!;

  const { lastMessage } = useWebSocket('/api/ws');

  const [queueList, setQueueList] = useState<Album[]>([]);
  const [currentDownload, setCurrentDownload] = useState<string|null>(null);

  useEffect(() => {
    axios.get("/api/queue").then(result => {
      const albums = (result.data as never) as Album[];
      processAlbums(albums);
    })
  }, [])

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type==="queue") {
      const albums = JSON.parse(lastMessage.message) as Album[]
      processAlbums(albums);
    }
  }, [lastMessage])

  const processAlbums = (albums: Album[]) => {
    if (albums.length>0) setCurrentDownload(albums[0].title);
    else setCurrentDownload(null);
    setQueueList(albums);
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
          <div className='QueuedAlbumList'>
            {queueList?.map((album, i) => {
              return (
                <div className='QueuedAlbum' key={i}>
                {i=== 0 && 
                  <FaDownload/>
                  ||
                  <FaHourglass/>
                }
                {album.title}
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

    <div className={`Queue ${loading||openAlbum||openQueue?'blur':''}`} onClick={ () => setOpenQueue(true) }>
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
