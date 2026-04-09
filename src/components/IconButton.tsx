import clsx from 'clsx'
import type { ComponentType } from 'react'
import type { LucideIcon, LucideProps } from 'lucide-react'

type IconComponent = LucideIcon | ComponentType<LucideProps>

type IconButtonProps = {
  icon: IconComponent
  label: string
  active?: boolean
  tone?: 'neutral' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function IconButton({
  icon: Icon,
  label,
  active = false,
  tone = 'neutral',
  size = 'md',
  className,
  onPointerUp,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={clsx('icon-button', className)}
      data-active={active}
      data-tone={tone}
      data-size={size}
      {...rest}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        event.currentTarget.blur()
      }}
    >
      <Icon size={size === 'lg' ? 22 : 20} strokeWidth={1.9} />
    </button>
  )
}
