import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type TooltipPlacement = 'top' | 'bottom'
type TooltipCoords = {
  left: number
  top: number
}

export function Tooltip({ children, label }: React.PropsWithChildren<{ label: string }>) {
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLSpanElement | null>(null)
  const ignoreFocusRef = useRef(false)
  const [active, setActive] = useState(false)
  const [placement, setPlacement] = useState<TooltipPlacement>('top')
  const [coords, setCoords] = useState<TooltipCoords>({ left: 0, top: 0 })

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
      const nextPlacement = spaceAbove >= neededHeight || spaceAbove >= spaceBelow ? 'top' : 'bottom'
      const horizontalMargin = 12
      const halfWidth = tooltipRect.width / 2
      const centeredLeft = wrapRect.left + wrapRect.width / 2
      const clampedLeft = Math.min(
        window.innerWidth - horizontalMargin - halfWidth,
        Math.max(horizontalMargin + halfWidth, centeredLeft),
      )
      const top = nextPlacement === 'top'
        ? wrapRect.top - tooltipGap
        : wrapRect.bottom + tooltipGap

      setPlacement(nextPlacement)
      setCoords({ left: clampedLeft, top })
    }

    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)

    return () => {
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [active, label])

  function clearWrappedFocus() {
    const focusedElement = document.activeElement

    if (focusedElement instanceof HTMLElement && wrapRef.current?.contains(focusedElement)) {
      focusedElement.blur()
    }
  }

  return (
    <span
      ref={wrapRef}
      className="tooltip-wrap"
      data-active={active}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onPointerDownCapture={(event) => {
        ignoreFocusRef.current = event.pointerType !== 'mouse'

        if (ignoreFocusRef.current) {
          setActive(false)
        }
      }}
      onPointerUpCapture={() => {
        if (!ignoreFocusRef.current) {
          return
        }

        window.requestAnimationFrame(() => {
          clearWrappedFocus()
          setActive(false)
        })
      }}
      onFocusCapture={() => {
        if (!ignoreFocusRef.current) {
          setActive(true)
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setActive(false)
        }

        ignoreFocusRef.current = false
      }}
    >
      {children}
      {active && typeof document !== 'undefined'
        ? createPortal(
            <span
              ref={tooltipRef}
              className="tooltip"
              data-active={active}
              data-placement={placement}
              style={{
                left: `${coords.left}px`,
                top: `${coords.top}px`,
              }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
