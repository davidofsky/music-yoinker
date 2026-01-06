"use client"
import { FaTasks, FaHourglass, FaDownload, FaTrash } from 'react-icons/fa'
import { useQueue } from '@/app/hooks/useQueue';
import { useContext, useEffect, useState } from 'react';
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
  const queuedTracks = useQueue();
  const [currentDownload, setCurrentDownload] = useState<string|null>(null);

  useEffect(() => {
    if (queuedTracks.length > 0) {
      setCurrentDownload(queuedTracks[0].title);
    } else {
      setCurrentDownload(null);
    }
  }, [queuedTracks]);

  const removeTrack = async (trackId: string) => {
    try {
      await axios.delete("/api/track", {
        params: { id: trackId }
      });
    } catch (err) {
      console.error('Failed to remove track:', err);
    }
  }

  return (
    <>
      <AnimatePresence>
        {openQueue && 
          <motion.div className='ModalBackground'
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenQueue(false)}> 
            <motion.div className='Modal'
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: {
                  default: { type: "tween" },
                  opacity: { ease: "linear" }
                }
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}> 
              Download queue
              <div className='QueuedList'>
                {queuedTracks.length === 0 ? (
                  <p className='EmptyQueue'>Queue is empty</p>
                ) : (
                  queuedTracks.map((track, i) => (
                    <div className='QueuedItem' key={track.id}>
                      {i === 0 ? <FaDownload/> : <FaHourglass/>}
                      <p>{track.title}</p>
                      {i > 0 && (
                        <FaTrash 
                          className='CancelQueue' 
                          onClick={() => removeTrack(track.id)}
                        />
                      )}
                    </div>
                  ))
                )}
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
      <div 
        className={`Queue ${loading || openAlbum || openQueue || openArtist ? 'blur' : ''}`} 
        onClick={() => setOpenQueue(true)}>
        <FaTasks/> 
        {currentDownload ? (
          <p>{currentDownload}</p>
        ) : (
          <p>Queue is empty</p>
        )}
      </div>
    </>
  )
}

export default Queue;
