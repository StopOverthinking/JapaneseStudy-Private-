import { useEffect, useRef, useState } from 'react'

type TooltipPlacement = 'top' | 'bottom'

export function Tooltip({ children, label }: React.PropsWithChildren<{ label: string }>) {
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLSpanElement | null>(null)
  const [active, setActive] = useState(false)
  const [placement, setPlacement] = useState<TooltipPlacement>('top')

  useEffect(() => {
    if (!active) {
      return
    }

    const updatePlacement = () => {
      const wrapElement = wrapRef.current
      const tooltipElement = tooltipRef.current

      if (!wrapElement || !tooltipElement) {
        return
      }

      const wrapRect = wrapElement.getBoundingClientRect()
      const tooltipRect = tooltipElement.getBoundingClientRect()
      const tooltipGap = 10
      const neededHeight = tooltipRect.height + tooltipGap
      const spaceAbove = wrapRect.top
      const spaceBelow = window.innerHeight - wrapRect.bottom

      setPlacement(spaceAbove >= neededHeight || spaceAbove >= spaceBelow ? 'top' : 'bottom')
    }

    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)

    return () => {
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [active, label])

  return (
    <span
      ref={wrapRef}
      className="tooltip-wrap"
      data-placement={placement}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocusCapture={() => setActive(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setActive(false)
        }
      }}
    >
      {children}
      <span ref={tooltipRef} className="tooltip">
        {label}
      </span>
    </span>
  )
}
