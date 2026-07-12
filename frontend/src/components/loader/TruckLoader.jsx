// Post-login transition. A transport truck drives across the screen from the
// right edge to the left over ~4 seconds (GSAP), then the overlay lifts and
// the app is revealed. Shown once, right after a successful sign-in.
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './TruckLoader.css'

const DRIVE_SECONDS = 4

export default function TruckLoader({ onDone }) {
  const root = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const finish = () => { if (!done.current) { done.current = true; onDone?.() } }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      const t = setTimeout(finish, 800)
      return () => clearTimeout(t)
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish })
      tl.from('.tl-label', { opacity: 0, y: 10, duration: 0.4, ease: 'power2.out' })
        // Truck starts off the left edge, drives to off the right edge.
        .fromTo('.tl-truck',
          { left: '0%', xPercent: -100 },
          { left: '100%', xPercent: 0, duration: DRIVE_SECONDS, ease: 'none' }, 0)
        // Subtle bob while driving.
        .to('.tl-truck', { y: -4, duration: 0.35, repeat: Math.round(DRIVE_SECONDS / 0.7), yoyo: true, ease: 'sine.inOut' }, 0)
        // Wheels spin forward (clockwise) for the whole drive.
        .to('.tl-wheel', { rotate: 1440, transformOrigin: 'center', duration: DRIVE_SECONDS, ease: 'none' }, 0)
        // Progress bar fills in step with the drive.
        .fromTo('.tl-bar-fill', { scaleX: 0 }, { scaleX: 1, duration: DRIVE_SECONDS, ease: 'none' }, 0)
        .to(root.current, { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' }, '+=0.1')
    }, root)

    return () => ctx.revert()
  }, [onDone])

  return (
    <div className="tl-shell" ref={root} role="status" aria-label="Preparing your dashboard">
      <div className="tl-label">Preparing your dashboard…</div>

      <div className="tl-track">
        <span className="tl-road" />
        <svg className="tl-truck" viewBox="0 0 80 40" width="88" height="44" aria-hidden="true">
          {/* trailer + cab */}
          <rect x="2" y="8" width="44" height="20" rx="2.5" fill="var(--brand-600)" />
          <path d="M46 14h14l9 8v6H46z" fill="var(--brand-700)" />
          <rect x="50" y="16" width="9" height="6" rx="1" fill="var(--brand-100)" />
          {/* wheels */}
          <g>
            <circle className="tl-wheel" cx="16" cy="30" r="5.5" fill="#1B1714" />
            <circle cx="16" cy="30" r="2" fill="var(--brand-100)" />
          </g>
          <g>
            <circle className="tl-wheel" cx="58" cy="30" r="5.5" fill="#1B1714" />
            <circle cx="58" cy="30" r="2" fill="var(--brand-100)" />
          </g>
        </svg>
      </div>

      <div className="tl-bar" aria-hidden="true"><span className="tl-bar-fill" /></div>
    </div>
  )
}
