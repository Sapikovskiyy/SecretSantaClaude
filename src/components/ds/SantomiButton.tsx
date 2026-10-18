/**
 * SantomiButton — the single button primitive of the app.
 * Variants: primary (red) · success (emerald) · premium (gold, AI Plus) · secondary (cream) · ghost · danger.
 * One prominent gradient CTA per screen; quieter actions use secondary/ghost.
 * Styling lives in src/styles/buttons.css (pure CSS press physics, reduced-motion aware).
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { haptic } from '@/lib/telegram'
import { Icon, type IconName } from '@/components/ui/Icon'

/** `telegram` is reserved for the single «Отправить в Telegram» action on the invite screen. */
export type ButtonVariant = 'primary' | 'success' | 'premium' | 'secondary' | 'ghost' | 'danger' | 'telegram'
export type ButtonSize = 'small' | 'medium' | 'large'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: IconName
  trailingIcon?: IconName
  fullWidth?: boolean
  /** Shows a spinner, keeps the size, blocks repeated taps. */
  loading?: boolean
  /** Only set AFTER the operation really succeeded — swaps the leading icon for a check. */
  succeeded?: boolean
  className?: string
  children?: ReactNode
}

const SIZE: Record<ButtonSize, string> = { small: 'sbtn-sm', medium: 'sbtn-md', large: 'sbtn-lg' }

export function buttonClass({ variant = 'primary', size = 'large', fullWidth, className = '' }: Pick<CommonProps, 'variant' | 'size' | 'fullWidth' | 'className'>) {
  return `sbtn sbtn-${variant} ${SIZE[size]} ${fullWidth ? 'sbtn-full' : ''} ${className}`.trim()
}

function Content({ leadingIcon, trailingIcon, loading, succeeded, children, size = 'large' }: CommonProps) {
  const iconSize = size === 'small' ? 17 : 20
  const lead = succeeded ? 'check' : leadingIcon
  return (
    <>
      {loading ? <span className="sbtn-spinner" aria-hidden /> : lead && <Icon name={lead} size={iconSize} strokeWidth={2.2} />}
      <span className="min-w-0 truncate">{children}</span>
      {trailingIcon && !loading && <Icon name={trailingIcon} size={iconSize} strokeWidth={2.2} />}
    </>
  )
}

export type SantomiButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>

export const SantomiButton = forwardRef<HTMLButtonElement, SantomiButtonProps>(function SantomiButton(
  { variant = 'primary', size = 'large', leadingIcon, trailingIcon, fullWidth, loading, succeeded, className, children, onClick, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (loading) return
        variant === 'primary' || variant === 'success' || variant === 'premium' ? haptic.press() : haptic.tap()
        onClick?.(e)
      }}
      {...rest}
    >
      <Content {...{ leadingIcon, trailingIcon, loading, succeeded, size }}>{children}</Content>
    </button>
  )
})

/** Same look, rendered as a router link (navigation integration). */
export function SantomiLinkButton({
  variant = 'primary',
  size = 'large',
  leadingIcon,
  trailingIcon,
  fullWidth,
  className,
  children,
  onClick,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link
      className={buttonClass({ variant, size, fullWidth, className })}
      onClick={(e) => {
        haptic.tap()
        onClick?.(e)
      }}
      {...rest}
    >
      <Content {...{ leadingIcon, trailingIcon, size }}>{children}</Content>
    </Link>
  )
}
