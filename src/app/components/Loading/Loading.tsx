import { motion } from "motion/react"
import { useContext } from "react";
import { LoadingCtx } from "@/app/context";

const Loading = () => {
  const [ loading ]= useContext(LoadingCtx)!;

    return (
      <>{loading && 
        <div className="LoadingBackground">
          <motion.div 
            className="LoadingModal"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
          >
            Retrieving data from Tidal...
          </motion.div>
        </div>
      }</>
    )
}

export default Loading
