// First-load brand intro. Stylish animated "TransitOps" wordmark (GSAP):
// letters rise + fade in, a road line draws across, a truck drives in and
// parks, then the whole screen lifts away. Shown once per browser session.
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './BrandSplash.css'

const WORD = 'TransitOps'

export default function BrandSplash({ onDone }) {
  const root = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    const finish = () => { if (!done.current) { done.current = true; onDone?.() } }

    // Respect reduced-motion: show briefly, then continue.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      const t = setTimeout(finish, 700)
      return () => clearTimeout(t)
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish })
      tl.from('.bs-letter', { yPercent: 120, opacity: 0, stagger: 0.05, duration: 0.6 })
        .from('.bs-tag', { opacity: 0, y: 12, duration: 0.5 }, '-=0.2')
        .fromTo('.bs-road', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, '-=0.4')
        .fromTo('.bs-truck', { x: '-140%' }, { x: '0%', duration: 0.9, ease: 'power2.out' }, '-=0.6')
        .to('.bs-truck', { x: '6%', duration: 0.15, yoyo: true, repeat: 1, ease: 'sine.inOut' })
        .to('.bs-stage', { scale: 1.04, duration: 0.5, ease: 'power1.in' }, '+=0.35')
        .to(root.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, '<')
    }, root)

    return () => ctx.revert()
  }, [onDone])

  return (
    <div className="bs-shell" ref={root} role="status" aria-label="Loading TransitOps">
      <div className="bs-stage">
        <div className="bs-wordmark" aria-hidden="true">
          {WORD.split('').map((ch, i) => (
            <span className="bs-letter" key={i}>{ch}</span>
          ))}
        </div>
        <div className="bs-tag">Smart Transport Operations</div>
        <div className="bs-roadwrap">
          <span className="bs-road" />
          <svg className="bs-truck" viewBox="0 0 64 32" width="52" height="26" aria-hidden="true">
            <rect x="2" y="7" width="34" height="16" rx="2" fill="currentColor" />
            <path d="M36 12h11l7 6v5H36z" fill="currentColor" />
            <circle cx="14" cy="25" r="4" fill="#1B1714" stroke="currentColor" strokeWidth="2" />
            <circle cx="45" cy="25" r="4" fill="#1B1714" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  )
}
