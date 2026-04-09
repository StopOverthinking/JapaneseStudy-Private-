import clsx from 'clsx'

type GlassPanelProps = React.PropsWithChildren<React.HTMLAttributes<HTMLElement> & {
  className?: string
  variant?: 'default' | 'strong' | 'floating'
  padding?: 'sm' | 'md' | 'lg'
}>

export function GlassPanel({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...rest
}: GlassPanelProps) {
  return (
    <section
      className={clsx(
        'glass-panel',
        variant !== 'default' && `glass-panel--${variant}`,
        `glass-padding-${padding}`,
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  )
}
