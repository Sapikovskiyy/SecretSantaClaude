import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

/** Graceful network state. Demo works offline; live mode will need the network. */
export function Offline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed inset-x-0 z-[70] mx-auto w-fit rounded-full bg-ember px-4 py-2 text-footnote text-snow"
          style={{ top: 'calc(var(--content-top) + 8px)' }}
          role="status"
        >
          Нет сети — изменения сохранятся на устройстве
        </motion.div>
      )}
    </AnimatePresence>
  )
}
