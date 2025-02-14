import { useEffect, useRef, useState } from 'react'

interface LazyLoadProps {
  children: React.ReactNode
  threshold?: number
}

export default function LazyLoad({ children, threshold = 0.1 }: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ height: '400px' }} />}
    </div>
  )
}