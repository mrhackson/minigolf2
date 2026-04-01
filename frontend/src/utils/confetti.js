/**
 * Lightweight canvas-based confetti animation.
 * No external dependencies required.
 */

export function launchConfetti(colors = ['#2e7d32', '#ffffff', '#ffd700']) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const PARTICLE_COUNT = 150
  const GRAVITY = 0.4
  const FADE_DURATION = 180 // frames

  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * -0.5,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    width: Math.random() * 10 + 6,
    height: Math.random() * 6 + 4,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: 1,
  }))

  let frame = 0

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    frame++

    const fadeStart = FADE_DURATION * 0.6
    const fadeFraction =
      frame > fadeStart ? 1 - (frame - fadeStart) / (FADE_DURATION - fadeStart) : 1

    let allGone = true
    for (const p of particles) {
      p.vy += GRAVITY
      p.x += p.vx
      p.y += p.vy
      p.angle += p.spin
      p.opacity = fadeFraction

      if (p.y < canvas.height + 20) {
        allGone = false
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
        ctx.restore()
      }
    }

    if (!allGone && frame < FADE_DURATION) {
      requestAnimationFrame(draw)
    } else {
      canvas.remove()
    }
  }

  requestAnimationFrame(draw)
}
