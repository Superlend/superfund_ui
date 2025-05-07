'use client'

import React, { useRef, useEffect } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
}

const ParticlesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas to full size of its container
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
      }
    }
    
    // Call once and add resize listener
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Create particles
    const particlesArray: Particle[] = []
    const particleCount = 50
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd']

    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 3 + 1
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const speedX = (Math.random() - 0.5) * 0.5
      const speedY = (Math.random() - 0.5) * 0.5
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      particlesArray.push({
        x, y, size, speedX, speedY, color
      })
    }
    
    // Connect particles with lines if they are close enough
    const connectParticles = () => {
      for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i + 1; j < particlesArray.length; j++) {
          const dx = particlesArray[i].x - particlesArray[j].x
          const dy = particlesArray[i].y - particlesArray[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 150) {
            const opacity = 1 - distance / 150
            ctx.globalAlpha = opacity * 0.1
            ctx.beginPath()
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 0.5
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y)
            ctx.lineTo(particlesArray[j].x, particlesArray[j].y)
            ctx.stroke()
            ctx.closePath()
          }
        }
      }
    }
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Update and draw particles
      for (let i = 0; i < particlesArray.length; i++) {
        const p = particlesArray[i]
        
        // Move particles
        p.x += p.speedX
        p.y += p.speedY
        
        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1
        
        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.2
        ctx.fill()
        ctx.closePath()
      }
      
      // Connect particles with lines
      connectParticles()
    }
    
    // Start animation
    animate()
    
    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none"
    />
  )
}

export default ParticlesBackground 