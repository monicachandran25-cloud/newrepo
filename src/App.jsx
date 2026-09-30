import { cloneElement, useEffect, useState } from 'react'
import parse, { domToReact } from 'html-react-parser'
import pageMarkup from './page.html?raw'

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function smoothPath(points) {
  if (points.length < 2) return ''
  let path = `M${points[0][0]},${points[0][1]}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index]
    const current = points[index]
    const next = points[index + 1]
    const following = points[index + 2] ?? next
    path += ` C${current[0] + (next[0] - previous[0]) / 6},${current[1] + (next[1] - previous[1]) / 6}`
    path += ` ${next[0] - (following[0] - current[0]) / 6},${next[1] - (following[1] - current[1]) / 6}`
    path += ` ${next[0]},${next[1]}`
  }

  return path
}

function MiniTrendChart() {
  const width = 640
  const height = 300
  const padding = { left: 10, right: 10, top: 14, bottom: 26 }
  const makeSeries = (seed, amplitude, offset) => {
    let state = seed * 53 + 3
    const random = () => {
      state = (state * 9301 + 49297) % 233280
      return state / 233280
    }

    return Array.from({ length: 12 }, (_, index) => {
      const value = offset + Math.sin(index / 2.1 + seed) * amplitude + index * 2.4 + (random() - 0.5) * 9
      const y = height - padding.bottom - (value / 100) * (height - padding.top - padding.bottom)
      return [padding.left + (index / 11) * (width - padding.left - padding.right), Math.max(padding.top, Math.min(height - padding.bottom, y))]
    })
  }

  const enquiries = makeSeries(3, 10, 42)
  const visits = makeSeries(8, 7, 24)
  const bookings = makeSeries(5, 5, 10)
  const enquiryPath = smoothPath(enquiries)
  const months = ['1 May', '8 May', '15 May', '22 May', '31 May']

  return (
    <>
      <defs>
        <linearGradient id="miniTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c71e7" stopOpacity=".18" />
          <stop offset="1" stopColor="#1c71e7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: 5 }, (_, index) => {
        const y = padding.top + ((height - padding.top - padding.bottom) * index) / 4
        return <line key={`grid-${index}`} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#EEF0F3" />
      })}
      <path d={`${enquiryPath} L${width - padding.right},${height - padding.bottom} L${padding.left},${height - padding.bottom} Z`} fill="url(#miniTrendFill)" />
      <path d={smoothPath(bookings)} fill="none" stroke="#c6cbd4" strokeWidth="2" strokeLinecap="round" />
      <path d={smoothPath(visits)} fill="none" stroke="#9db6d6" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
      <path d={enquiryPath} fill="none" stroke="#1c71e7" strokeWidth="2.6" strokeLinecap="round" />
      {enquiries.map(([cx, cy], index) => (index % 2 === 0 || index === enquiries.length - 1)
        ? <circle key={`point-${index}`} cx={cx} cy={cy} r="3" fill="#1c71e7" stroke="#fff" strokeWidth="1.5" />
        : null)}
      {months.map((month, index) => (
        <text key={month} x={padding.left + (index / 4) * (width - padding.left - padding.right)} y={height - 6} textAnchor={index === 0 ? 'start' : index === 4 ? 'end' : 'middle'} fontSize="10" fill="#8C8C86" fontFamily="Inter">
          {month}
        </text>
      ))}
    </>
  )
}

function SourceDonut() {
  const sources = [
    { value: 442, color: '#1c71e7' },
    { value: 289, color: '#2f8ce0' },
    { value: 203, color: '#E0B24A' },
    { value: 151, color: '#9887DB' },
    { value: 90, color: '#E28B95' },
    { value: 73, color: '#C7C7C0' },
  ]
  const circumference = 2 * Math.PI * 44
  const total = sources.reduce((sum, source) => sum + source.value, 0)
  let offset = 0

  return (
    <>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#EDEFF2" strokeWidth="15" />
      {sources.map((source) => {
        const length = (source.value / total) * circumference
        const circle = (
          <circle
            key={source.color}
            cx="60"
            cy="60"
            r="44"
            fill="none"
            stroke={source.color}
            strokeWidth="15"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
          />
        )
        offset += length
        return circle
      })}
    </>
  )
}

function Sparkline({ color, seed }) {
  let state = seed * 9301 + 49297
  const random = () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
  const points = Array.from({ length: 24 }, (_, index) => {
    const value = Math.max(6, Math.min(38, 26 + Math.sin(index / 2.5 + seed) * 5 + (random() - 0.5) * 10 - index * 0.35))
    return [(index / 23) * 220, 42 - value]
  })
  const path = smoothPath(points)
  const gradientId = `sparkline-${seed}`

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L220,42 L0,42 Z`} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [activeNav, setActiveNav] = useState(0)
  const [selectedPills, setSelectedPills] = useState(() => new Set())

  useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 12)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal:not([data-load])')
    if (prefersReducedMotion()) {
      revealItems.forEach((item) => item.classList.add('in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    )

    revealItems.forEach((item) => observer.observe(item))
    document.querySelectorAll('.reveal[data-load]').forEach((item) => item.classList.add('in'))
    const dashTimer = window.setTimeout(() => {
      const dashboard = document.getElementById('dash')
      if (dashboard) {
        dashboard.style.opacity = '1'
        dashboard.style.transform = 'none'
      }
    }, 380)

    return () => {
      observer.disconnect()
      window.clearTimeout(dashTimer)
    }
  }, [])

  useEffect(() => {
    const reducedMotion = prefersReducedMotion()
    const frames = new Set()
    const animateNumbers = (elements, getValue, renderValue, duration = 1300) => {
      if (reducedMotion) {
        elements.forEach((element) => renderValue(element, getValue(element)))
        return
      }

      const startedAt = performance.now()
      const tick = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1)
        const eased = 1 - (1 - progress) ** 3
        elements.forEach((element) => renderValue(element, getValue(element) * eased))
        if (progress < 1) frames.add(requestAnimationFrame(tick))
      }
      frames.add(requestAnimationFrame(tick))
    }

    const analytics = document.getElementById('analytics')
    const metrics = document.querySelector('.metrics')
    const observers = []

    if (analytics) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        analytics.classList.add('in')
        animateNumbers(
          [...analytics.querySelectorAll('.an2-m .k')],
          (element) => Number(element.dataset.count),
          (element, value) => {
            const decimals = Number(element.dataset.dec || 0)
            const number = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-IN')
            element.textContent = `${element.dataset.pre || ''}${number}${element.dataset.suf || ''}`
          },
        )
        observer.disconnect()
      }, { threshold: 0.25 })
      observer.observe(analytics)
      observers.push(observer)
    }

    if (metrics) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        animateNumbers(
          [...metrics.querySelectorAll('.mx .n[data-target]')],
          (element) => Number(element.dataset.target),
          (element, value) => {
            const number = Math.round(value).toLocaleString('en-IN')
            element.textContent = `${element.dataset.pre || ''}${number}${element.dataset.suf || ''}`
          },
          1500,
        )
        observer.disconnect()
      }, { threshold: 0.4 })
      observer.observe(metrics)
      observers.push(observer)
    }

    return () => {
      observers.forEach((observer) => observer.disconnect())
      frames.forEach((frame) => cancelAnimationFrame(frame))
    }
  }, [])

  useEffect(() => {
    const space = document.getElementById('plxSpace')
    const sticky = document.getElementById('plxSticky')
    const track = document.getElementById('plxTrack')
    if (!space || !sticky || !track) return undefined

    const ghost = document.getElementById('plxGhost')
    const fill = document.getElementById('plxFill')
    const dot = document.getElementById('plxDot')
    const columns = [...track.querySelectorAll('.pcol')]
    const reducedMotion = prefersReducedMotion()
    let active = false
    let overflow = 0
    let frame = 0
    let resizeTimer

    const update = () => {
      frame = 0
      if (!active) return
      const scrolled = Math.min(Math.max(-space.getBoundingClientRect().top, 0), overflow)
      const progress = overflow > 0 ? scrolled / overflow : 0
      track.style.transform = `translate3d(${-scrolled}px, 0, 0)`
      if (ghost) ghost.style.transform = `translate3d(${-scrolled * 0.42}px, -50%, 0)`
      if (fill) fill.style.width = `${progress * 100}%`
      if (dot) dot.style.left = `${progress * 100}%`
      columns.forEach((column) => {
        if (column.getBoundingClientRect().left < window.innerWidth * 0.92) column.classList.add('in')
      })
    }

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const layout = () => {
      if (window.innerWidth <= 900 || reducedMotion) {
        space.style.height = ''
        track.style.transform = ''
        columns.forEach((column) => column.classList.add('in'))
        active = false
        return
      }
      active = true
      overflow = Math.max(track.scrollWidth - sticky.clientWidth + 40, 0)
      space.style.height = `${window.innerHeight + overflow}px`
      scheduleUpdate()
    }

    const handleResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(layout, 150)
    }

    layout()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(resizeTimer)
      cancelAnimationFrame(frame)
      space.style.height = ''
      track.style.transform = ''
    }
  }, [])

  useEffect(() => {
    const list = document.getElementById('mileList')
    if (!list) return undefined

    const items = [...list.querySelectorAll('.mile-item')]
    const fill = document.getElementById('mileFill')
    const cap = document.getElementById('mileCap')
    const reducedMotion = prefersReducedMotion()
    const observer = reducedMotion ? null : new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('shown')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' })

    items.forEach((item) => {
      if (observer) observer.observe(item)
      else item.classList.add('shown', 'active')
    })

    if (reducedMotion) {
      if (fill) fill.style.height = '100%'
      return undefined
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = list.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const progress = Math.min(Math.max((viewportHeight * 0.62 - rect.top) / (viewportHeight * 0.12 + rect.height), 0), 1)
      const y = 8 + progress * (list.clientHeight - 16)
      if (fill) fill.style.height = `${progress * 100}%`
      if (cap) {
        cap.style.top = `${y}px`
        cap.style.opacity = progress > 0.002 ? '1' : '0'
      }
      items.forEach((item) => item.classList.toggle('active', y >= item.offsetTop + 26))
    }
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      cancelAnimationFrame(frame)
    }
  }, [])

  const options = (() => {
    let navIndex = 0
    let pillIndex = 0

    return {
      replace(node) {
        if (node.type !== 'tag') return undefined

        const element = domToReact([node])
        if (!element || typeof element !== 'object') return undefined

        const props = {}
        const { id, class: className = '' } = node.attribs

        if (id === 'hdr' && headerScrolled) {
          props.className = `${className} scrolled`
        }

        if (id === 'burger') {
          props.onClick = () => setMenuOpen((open) => !open)
          props['aria-expanded'] = menuOpen
        }

        if (id === 'mobileMenu') {
          props.className = `${className}${menuOpen ? ' open' : ''}`
          props['aria-hidden'] = !menuOpen
          props.onClick = (event) => {
            if (event.target.closest('a')) setMenuOpen(false)
          }
        }

        if (id === 'enqForm') {
          props.onSubmit = (event) => {
            event.preventDefault()
            setSubmitted(true)
          }
          if (submitted) props.hidden = true
        }

        if (id === 'enqSuccess' && submitted) {
          props.className = `${className} show`
        }

        if (className.split(/\s+/).includes('dn-item')) {
          const itemIndex = navIndex++
          props.onClick = () => setActiveNav(itemIndex)
          props.className = `${className.replace(/\sactive\b/g, '')}${activeNav === itemIndex ? ' active' : ''}`
        }

        if (className.split(/\s+/).includes('pill')) {
          const itemIndex = pillIndex++
          props.onClick = () => {
            setSelectedPills((current) => {
              const next = new Set(current)
              if (next.has(itemIndex)) next.delete(itemIndex)
              else next.add(itemIndex)
              return next
            })
          }
          if (selectedPills.has(itemIndex)) props.className = `${className} on`
        }

        if (id === 'miniTrend') {
          return cloneElement(element, {}, <MiniTrendChart />)
        }

        if (id === 'srcDonut') {
          return cloneElement(element, {}, <SourceDonut />)
        }

        if (className.split(/\s+/).includes('kpi-spark')) {
          return cloneElement(element, {}, <Sparkline color={node.attribs['data-color']} seed={Number(node.attribs['data-seed'])} />)
        }

        return Object.keys(props).length ? cloneElement(element, props) : undefined
      },
    }
  })()

  return (
    <>{parse(pageMarkup, options)}</>
  )
}

export default App
