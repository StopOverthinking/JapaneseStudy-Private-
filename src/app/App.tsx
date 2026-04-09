import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { FloatingOrb } from '@/components/FloatingOrb'
import { ScreenFrame } from '@/components/ScreenFrame'

type TransitionPhase = 'enter' | 'idle' | 'exit'

function getRouteSignature(location: ReturnType<typeof useLocation>) {
  return `${location.pathname}${location.search}${location.hash}`
}

export function App() {
  const location = useLocation()
  const outlet = useOutlet()
  const pendingRouteRef = useRef({ location, outlet })
  const [displayLocation, setDisplayLocation] = useState(location)
  const [displayOutlet, setDisplayOutlet] = useState(outlet)
  const [phase, setPhase] = useState<TransitionPhase>('enter')
  const currentSignature = getRouteSignature(location)
  const displaySignature = getRouteSignature(displayLocation)

  useEffect(() => {
    pendingRouteRef.current = { location, outlet }

    if (currentSignature !== displaySignature) {
      setPhase('exit')
    }
  }, [currentSignature, displaySignature, location, outlet])

  return (
    <AppProviders>
      <div className="app-shell">
        <div className="noise-layer" />
        <FloatingOrb className="orb orb-a" />
        <FloatingOrb className="orb orb-b" />
        <ScreenFrame>
          <motion.div
            key={displaySignature}
            className="page-shell"
            initial={{ opacity: 0, scale: 0.992, filter: 'blur(10px)' }}
            animate={phase === 'exit' ? { opacity: 0, scale: 1.008, filter: 'blur(10px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: phase === 'exit' ? 0.18 : 0.24, ease: 'easeOut' }}
          onAnimationComplete={() => {
              if (phase === 'exit') {
                const pendingRoute = pendingRouteRef.current
                setDisplayLocation(pendingRoute.location)
                setDisplayOutlet(pendingRoute.outlet)
                setPhase('enter')
                return
              }

              if (phase === 'enter') {
                setPhase('idle')
              }
            }}
          >
            {displayOutlet}
          </motion.div>
        </ScreenFrame>
      </div>
    </AppProviders>
  )
}
