import { motion } from 'motion/react'
import { haptic } from '@/lib/telegram'

/** iOS switch: green track, knob stretches while pressed and springs across. */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      initial={false}
      animate="rest"
      whileTap={disabled ? undefined : 'pressed'}
      onClick={(e) => {
        e.preventDefault()
        haptic.select()
        onChange(!checked)
      }}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-150 disabled:opacity-50 ${checked ? 'bg-[#15935c]' : 'bg-white/20'}`}
    >
      <motion.span
        className="absolute left-0 top-[2px] h-[27px] rounded-full bg-snow shadow-[0_2px_4px_rgba(0,0,0,.25)]"
        variants={{
          rest: { x: checked ? 22 : 2, width: 27 },
          pressed: { x: checked ? 16 : 2, width: 33 },
        }}
        transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.2 }}
      />
    </motion.button>
  )
}
