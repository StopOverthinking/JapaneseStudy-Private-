import { useEffect, useRef, useState } from 'react'

type TooltipPlacement = 'top' | 'bottom'

export function Tooltip({ children, label }: React.PropsWithChildren<{ label: string }>) {
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLSpanElement | null>(null)
  const ignoreFocusRef = useRef(false)
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
      data-placement={placement}
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
      <span ref={tooltipRef} className="tooltip">
        {label}
      </span>
    </span>
  )
}
