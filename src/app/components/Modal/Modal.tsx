import { AnimatePresence, motion } from "motion/react"
import { ReactNode } from "react"

type Props = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

const Modal = ({ isOpen, onClose, children }: Props) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="ModalBackground" onClick={onClose}>
          <motion.div
            className="Modal"
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
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal
