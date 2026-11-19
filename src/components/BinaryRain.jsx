import { useEffect, useRef } from 'react'

// Falling 0s and 1s behind the loader and sign-in. Quiet on purpose.
export default function BinaryRain({ opacity = 0.35 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const size = 16
    let cols = 0
    let drops = []
    let raf

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(window.innerWidth / size)
      drops = Array.from({ length: cols }, () => Math.random() * -40)
    }

    resize()
    window.addEventListener('resize', resize)

    let last = 0
    const tick = (t) => {
      raf = requestAnimationFrame(tick)
      if (t - last < 60) return
      last = t
      ctx.fillStyle = 'rgba(7, 12, 31, 0.18)'
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.font = `${size - 2}px "JetBrains Mono", monospace`
      for (let i = 0; i < cols; i++) {
        const bit = Math.random() > 0.5 ? '1' : '0'
        ctx.fillStyle = Math.random() > 0.95 ? '#e9fff1' : 'rgba(141, 255, 181, 0.55)'
        ctx.fillText(bit, i * size, drops[i] * size)
        if (drops[i] * size > window.innerHeight && Math.random() > 0.975) drops[i] = 0
        drops[i] += 1
      }
    }

    if (reduce) {
      ctx.fillStyle = '#070c1f'
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
    } else {
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="binary-rain" style={{ opacity }} aria-hidden="true" />
}
