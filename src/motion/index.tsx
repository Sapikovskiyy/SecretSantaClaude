import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { motionTokens as T } from './tokens';

/** Direction-aware page variants: forward slides in from the right, back from the left. */
export const pageVariants: Variants = {
  enter: (d: number) => ({ opacity: 0, x: d * 24 }),
  center: { opacity: 1, x: 0, transition: { duration: T.duration.normal, ease: T.easing.standard } },
  exit: (d: number) => ({ opacity: 0, x: d * -16, transition: { duration: T.duration.fast, ease: T.easing.smooth } }),
};

const listV: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const itemV: Variants = {
  hidden: { opacity: 0, y: 12, scale: T.scale.entrance },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: T.duration.normal, ease: T.easing.standard } },
};
export function AnimatedList({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.ul className={className} variants={listV} initial="hidden" animate="show">{children}</motion.ul>;
}
export function AnimatedItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.li className={className} variants={itemV}>{children}</motion.li>;
}
export function AnimatedCard({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <motion.button onClick={onClick} className={className} whileTap={{ scale: 0.98 }} transition={{ duration: T.duration.instant }}>{children}</motion.button>
  );
}

export function AnimatedBottomSheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="backdrop" className="fixed inset-0 z-30 flex items-end bg-black/50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: T.duration.normal }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={T.spring.sheet}
            className="mx-auto max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-sheet bg-cream p-5 text-cocoa"
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AnimatedFeedback({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          transition={{ duration: T.duration.fast }} className="rounded-full bg-pine px-4 py-2 text-center text-sm font-bold">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export { motionTokens } from './tokens';
