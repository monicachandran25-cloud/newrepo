import { cloneElement, useEffect, useRef, useState } from 'react'
import parse, { domToReact } from 'html-react-parser'
import pageMarkup from './page.html?raw'
import SalesAgentWidget from './components/SalesAgentWidget.jsx'

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

function getNodeText(node) {
  if (node.type === 'text') return node.data
  return (node.children ?? []).map(getNodeText).join(' ')
}

function findNodeByClass(node, targetClass) {
  if (node.attribs?.class?.split(/\s+/).includes(targetClass)) return node
  for (const child of node.children ?? []) {
    const match = findNodeByClass(child, targetClass)
    if (match) return match
  }
  return null
}

function AccountControl({ mobile = false, onLogout }) {
  const [open, setOpen] = useState(false)
  const controlRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (!controlRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className={`account-control${mobile ? ' mobile-account-control' : ''}`} ref={controlRef}>
      <button
        type="button"
        className="account-trigger"
        aria-label="Account: Arjun Mehta, Sales Head"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
      >
        <span className="account-avatar" aria-hidden="true">AM</span>
        <span className="account-label">
          <strong>Arjun Mehta</strong>
          {!mobile && <small>Sales Head</small>}
        </span>
        <svg className="account-caret" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="account-popover" role="menu" aria-label="Arjun Mehta account">
          <div className="account-summary">
            <span className="account-avatar" aria-hidden="true">AM</span>
            <span>
              <strong>Arjun Mehta</strong>
              <small>Signed in · Sales Head</small>
            </span>
          </div>
          <a role="menuitem" href="mailto:hello@zevro.com?subject=Account%20support">Account support</a>
          <button type="button" role="menuitem" onClick={onLogout}>Log out</button>
        </div>
      )}
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)

  const submitLogin = (event) => {
    event.preventDefault()
    const emailField = event.currentTarget.querySelector('#login-email')
    emailField.value = emailField.value.trim()
    if (!event.currentTarget.reportValidity()) return
    onLogin()
  }

  return (
    <main className="login-screen">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="zmark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="#1c71e7"/><path d="M10.5 11h11l-11 10h11" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <strong>Zevro</strong><span>CRM</span>
        </div>
        <p className="login-eyebrow">REAL ESTATE CRM</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-intro">Sign in to your sales workspace.</p>
        <form className="login-form" onSubmit={submitLogin}>
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@company.com"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="login-password">Password</label>
          <div className="login-password-field">
            <input
              id="login-password"
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
            <button type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)}>
              {passwordVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          <button className="login-submit" type="submit">Log in</button>
        </form>
        <p className="login-demo-note">Demo mode: sign-in is simulated locally; no credentials are sent to a server.</p>
      </section>
    </main>
  )
}

function PricingSection() {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="wrap">
        <div className="pricing-intro">
          <span className="eyebrow"><span className="dot" />Pricing</span>
          <h2>Pricing shaped around your sales operation.</h2>
          <p className="lead">Get a quote based on your workspace, projects, team size, and the tools your sales process needs.</p>
        </div>
        <div className="pricing-factors">
          <article className="pricing-factor">
            <span>01 / WORKSPACE</span>
            <h3>Set up for your team</h3>
            <p>Discuss the workspace structure, team size, and the projects you need to manage.</p>
          </article>
          <article className="pricing-factor">
            <span>02 / WORKFLOW</span>
            <h3>Choose the coverage</h3>
            <p>Review lead capture, site visits, booking workflows, reporting, and channel partners.</p>
          </article>
          <article className="pricing-factor">
            <span>03 / QUOTE</span>
            <h3>Get a clear proposal</h3>
            <p>Talk through onboarding and the configuration that fits your sales operation.</p>
          </article>
        </div>
        <div className="pricing-action">
          <p>Pricing is provided after a short walkthrough of your requirements.</p>
          <a className="btn btn-primary" href="#enquiry">Request pricing</a>
        </div>
      </div>
    </section>
  )
}

function readDemoSession() {
  try {
    return window.sessionStorage.getItem('zevro-demo-auth') !== 'signed-out'
  } catch {
    return true
  }
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [signedIn, setSignedIn] = useState(readDemoSession)
  const [activeNav, setActiveNav] = useState(0)
  const [dashboardMonth, setDashboardMonth] = useState('This Month')
  const [dashboardMonthOpen, setDashboardMonthOpen] = useState(false)
  const [selectedPills, setSelectedPills] = useState(['All Projects', 'This Year'])
  const [openPill, setOpenPill] = useState(null)
  const dashboardMonthRef = useRef(null)
  const dashboardMonthTriggerRef = useRef(null)

  const jumpToSection = (sectionId) => {
    const section = sectionId ? document.getElementById(sectionId) : null
    if (!section) return

    const top = section.getBoundingClientRect().top + window.scrollY - 72
    window.history.replaceState(null, '', `#${sectionId}`)
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'instant' })
  }

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return undefined

    const sectionId = hash.replace(/^#/, '')
    if (!sectionId) return undefined

    const scrollFromHash = () => {
      requestAnimationFrame(() => {
        jumpToSection(sectionId)
      })
    }

    scrollFromHash()
    window.addEventListener('hashchange', scrollFromHash)
    return () => window.removeEventListener('hashchange', scrollFromHash)
  }, [])

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
    if (!menuOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      document.getElementById('burger')?.focus()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  useEffect(() => {
    if (openPill === null) return undefined
    const closeFilter = (event) => {
      if (event.key === 'Escape') {
        setOpenPill(null)
        return
      }
      if (!event.target.closest?.('.filter-control')) setOpenPill(null)
    }
    document.addEventListener('click', closeFilter)
    document.addEventListener('keydown', closeFilter)
    return () => {
      document.removeEventListener('click', closeFilter)
      document.removeEventListener('keydown', closeFilter)
    }
  }, [openPill])

  useEffect(() => {
    if (!dashboardMonthOpen) return undefined
    const closeDashboardMonth = (event) => {
      if (event.type === 'keydown') {
        if (event.key !== 'Escape') return
        setDashboardMonthOpen(false)
        dashboardMonthTriggerRef.current?.focus()
        return
      }
      if (!dashboardMonthRef.current?.contains(event.target)) setDashboardMonthOpen(false)
    }
    document.addEventListener('pointerdown', closeDashboardMonth)
    document.addEventListener('keydown', closeDashboardMonth)
    return () => {
      document.removeEventListener('pointerdown', closeDashboardMonth)
      document.removeEventListener('keydown', closeDashboardMonth)
    }
  }, [dashboardMonthOpen])

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
    let analyticsBarIndex = 0
    let analyticsAxisIndex = 0
    let leadContactIndex = 0
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dashboardSections = ['hdr', 'pipeline', 'benefits', 'leadflow', 'pipeline', 'leadflow', 'analytics', 'enquiry']
    const filterChoices = [
      ['All Projects', 'Green Valley', 'Urban Heights', 'Palm County'],
      ['This Year', 'Last Year', ...months],
    ]
    const analyticsBookings = {
      'All Projects': { 'This Year': [12, 16, 14, 20, 18, 21], 'Last Year': [9, 12, 11, 15, 14, 17] },
      'Green Valley': { 'This Year': [7, 9, 8, 12, 11, 14], 'Last Year': [5, 7, 6, 9, 8, 10] },
      'Urban Heights': { 'This Year': [4, 5, 5, 6, 6, 5], 'Last Year': [3, 4, 4, 5, 4, 5] },
      'Palm County': { 'This Year': [1, 2, 1, 2, 1, 2], 'Last Year': [1, 1, 1, 1, 2, 2] },
    }
    const monthlyBookingTotals = {
      'All Projects': [12, 16, 14, 20, 18, 21, 17, 19, 15, 22, 20, 24],
      'Green Valley': [7, 9, 8, 12, 11, 14, 10, 11, 9, 13, 12, 15],
      'Urban Heights': [4, 5, 5, 6, 6, 5, 5, 6, 4, 7, 6, 7],
      'Palm County': [1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2],
    }
    const weekShares = [0.14, 0.16, 0.18, 0.16, 0.18, 0.18]
    const destinations = {
      'zevro crm home': '#hdr',
      zevrocrm: '#hdr',
      platform: '#pipeline',
      solutions: '#benefits',
      customers: '#testimonials',
      pricing: '#pricing',
      'book a demo': '#enquiry',
      'talk to sales': '#enquiry',
      overview: '#pipeline',
      leads: '#leadflow',
      projects: '#benefits',
      'site visits': '#leadflow',
      deals: '#pipeline',
      bookings: '#pipeline',
      builders: '#benefits',
      developers: '#benefits',
      'sales teams': '#benefits',
      'channel partners': '#leadflow',
      agencies: '#benefits',
      about: '#testimonials',
      contact: '#enquiry',
      faqs: '#enquiry',
    }

    const exportPipeline = () => {
      const rows = [['Stage', 'Lead', 'Project', 'Value']]
      document.querySelectorAll('.plx-track .pcol').forEach((column) => {
        const stage = column.querySelector('.pcol-h .hd')?.textContent.trim() ?? ''
        column.querySelectorAll('.lead-card').forEach((card) => {
          const tags = [...card.querySelectorAll('.tagp')]
          rows.push([
            stage,
            card.querySelector('.lc-nm')?.textContent.trim() ?? '',
            tags.at(-1)?.textContent.trim() ?? '',
            card.querySelector('.lc-val')?.textContent.trim() ?? '',
          ])
        })
      })
      const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const download = document.createElement('a')
      download.href = url
      download.download = 'zevro-pipeline-leads.csv'
      document.body.appendChild(download)
      download.click()
      download.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    return {
      replace(node) {
        if (node.type !== 'tag') return undefined

        const element = domToReact([node])
        if (!element || typeof element !== 'object') return undefined

        const props = {}
        const { id, class: className = '' } = node.attribs
        const classes = className.split(/\s+/)

        if (classes.includes('lead-card')) {
          const leadIndex = leadContactIndex++
          const nameNode = findNodeByClass(node, 'lc-nm')
          const customerName = nameNode ? getNodeText(nameNode).trim() : 'Customer'
          const emailName = customerName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')
          const demoPhone = `+120255501${String(leadIndex + 1).padStart(2, '0')}`
          const message = encodeURIComponent(`Hi ${customerName}, following up on your enquiry.`)

          return cloneElement(element, {}, (
            <>
              {domToReact(node.children, options)}
              <div className="lead-contact-actions" role="group" aria-label={`Contact ${customerName}`}>
              <a href={`tel:${demoPhone}`} aria-label={`Call ${customerName}`} title={`Call ${customerName}`}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.63a2 2 0 0 1-.45 2.11L8 9.75a16 16 0 0 0 6 6l1.29-1.29a2 2 0 0 1 2.11-.45c.85.3 1.73.51 2.63.63A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <a href={`mailto:${emailName}@example.com?subject=${encodeURIComponent(`Following up, ${customerName}`)}`} aria-label={`Email ${customerName}`} title={`Email ${customerName}`}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <a href={`sms:${demoPhone}?body=${message}`} aria-label={`Message ${customerName}`} title={`Message ${customerName}`}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              </div>
            </>
          ))
        }

        if (node.name === 'a' && classes.includes('signin')) {
          const mobile = node.parent?.attribs?.class?.split(/\s+/).includes('mact') ?? false
          return (
            <AccountControl
              mobile={mobile}
              onLogout={() => {
                window.sessionStorage.setItem('zevro-demo-auth', 'signed-out')
                setMenuOpen(false)
                setSignedIn(false)
              }}
            />
          )
        }

        if (node.name === 'a' && typeof node.attribs.href === 'string' && node.attribs.href.startsWith('#')) {
          const text = getNodeText(node).replace(/\s+/g, ' ').trim()
          const label = (node.attribs['aria-label'] || text).replace(/^(.*?)\s+\1$/i, '$1').toLowerCase()
          const destination = destinations[label] ?? (node.attribs.href === '#' ? null : node.attribs.href)
          if (destination) {
            props.href = destination
          } else if (label === 'linkedin') {
            props.href = 'https://www.linkedin.com/company/etherealdesign/'
            props.target = '_blank'
            props.rel = 'noopener noreferrer'
          } else if (label === 'instagram') {
            props.href = 'https://www.instagram.com/etherealdesign.co_/'
            props.target = '_blank'
            props.rel = 'noopener noreferrer'
          } else if (label === 'email') {
            props.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=hello%40zevrocrm.com'
            props.target = '_blank'
            props.rel = 'noopener noreferrer'
          } else {
            props.href = `mailto:hello@zevro.com?subject=${encodeURIComponent(`${text || label} enquiry`)}`
          }

          const parentClasses = node.parent?.attribs?.class?.split(/\s+/) ?? []
          const sectionId = destination?.replace(/^#/, '')
          if (sectionId) {
            props.onClick = (event) => {
              event.preventDefault()
              jumpToSection(sectionId)
              const section = document.getElementById(sectionId)
              section?.querySelectorAll('.reveal').forEach((item) => item.classList.add('in'))
            }
          }
        }

        if (id === 'hdr' && headerScrolled) {
          props.className = `${className} scrolled`
        }

        if (id === 'burger') {
          props.onClick = () => setMenuOpen((open) => !open)
          props['aria-expanded'] = menuOpen
          props['aria-label'] = menuOpen ? 'Close menu' : 'Open menu'
        }

        if (classes.includes('dt-pill') && !classes.includes('sm')) {
          return (
            <div className={`${className} dashboard-period-control`} ref={dashboardMonthRef}>
              <button
                type="button"
                className="dashboard-month-trigger"
                aria-label="Dashboard month"
                aria-haspopup="listbox"
                aria-expanded={dashboardMonthOpen}
                onClick={() => setDashboardMonthOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
                  event.preventDefault()
                  setDashboardMonthOpen(true)
                  requestAnimationFrame(() => {
                    document.querySelector(`[data-dashboard-month-option="${dashboardMonth}"]`)?.focus()
                  })
                }}
                ref={dashboardMonthTriggerRef}
              >
                <span>{dashboardMonth}</span>
                <svg width="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
              {dashboardMonthOpen && (
                <div className="filter-options dashboard-month-options" role="listbox" aria-label="Dashboard month">
                  {['This Month', ...months].map((month) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={dashboardMonth === month}
                      className={dashboardMonth === month ? 'selected' : ''}
                      data-dashboard-month-option={month}
                      key={month}
                      onClick={() => {
                        setDashboardMonth(month)
                        setDashboardMonthOpen(false)
                        dashboardMonthTriggerRef.current?.focus()
                      }}
                      onKeyDown={(event) => {
                        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
                        event.preventDefault()
                        const options = [...event.currentTarget.parentElement.querySelectorAll('[role="option"]')]
                        const currentIndex = options.indexOf(event.currentTarget)
                        const nextIndex = event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? options.length - 1
                            : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
                        options[nextIndex]?.focus()
                      }}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
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
            event.currentTarget.querySelectorAll('input, textarea').forEach((field) => {
              field.value = field.value.trim()
            })
            if (!event.currentTarget.reportValidity()) return
            setSubmitted(true)
          }
          if (submitted) props.hidden = true
        }

        if (['ef-name', 'ef-email', 'ef-phone', 'ef-company', 'ef-role', 'ef-team'].includes(id)) {
          props.required = true
        }

        if (id === 'ef-name') {
          props.minLength = 2
          props.maxLength = 80
          props.onInput = (event) => {
            const value = event.currentTarget.value.trim()
            event.currentTarget.setCustomValidity(value && value.length < 2 ? 'Enter at least 2 characters for your name.' : '')
          }
        }

        if (id === 'ef-email') {
          props.maxLength = 254
          props.autoCapitalize = 'none'
          props.spellCheck = false
        }

        if (id === 'ef-phone') {
          props.inputMode = 'tel'
          props.maxLength = 24
          props.title = 'Enter a phone number with 10 to 15 digits.'
          props.onInput = (event) => {
            const value = event.currentTarget.value.trim()
            const digits = value.replace(/\D/g, '').length
            const formatIsValid = /^\+?[0-9\s().-]+$/.test(value)
            event.currentTarget.setCustomValidity(value && (!formatIsValid || digits < 10 || digits > 15)
              ? 'Enter a valid phone number with 10 to 15 digits.'
              : '')
          }
        }

        if (id === 'ef-company') {
          props.minLength = 2
          props.maxLength = 120
          props.onInput = (event) => {
            const value = event.currentTarget.value.trim()
            event.currentTarget.setCustomValidity(value && value.length < 2 ? 'Enter at least 2 characters for your company.' : '')
          }
        }

        if (id === 'ef-msg') {
          props.maxLength = 1000
          props.onInput = (event) => {
            const value = event.currentTarget.value.trim()
            event.currentTarget.setCustomValidity(value && value.length < 10 ? 'Enter at least 10 characters, or leave this field blank.' : '')
          }
        }

        if (node.name === 'button' && node.attribs['aria-label'] === 'Subscribe') {
          props.onClick = () => {
            const emailInput = document.querySelector('.sf-brand input[type="email"]')
            if (!emailInput) return
            emailInput.required = true
            emailInput.value = emailInput.value.trim()
            emailInput.maxLength = 254
            if (!emailInput.reportValidity()) return
            const subject = encodeURIComponent('Newsletter subscription')
            const body = encodeURIComponent(`Please subscribe ${emailInput.value.trim()} to Zevro updates.`)
            window.location.href = `mailto:hello@zevro.com?subject=${subject}&body=${body}`
          }
        }

        if (id === 'enqSuccess' && submitted) {
          props.className = `${className} show`
        }

        if (classes.includes('dn-item')) {
          const itemIndex = navIndex++
          const navigateToFeature = () => {
            setActiveNav(itemIndex)
            const sectionId = dashboardSections[itemIndex]
            const section = document.getElementById(sectionId)
            if (!section) return
            jumpToSection(sectionId)
          }
          props.onClick = navigateToFeature
          props.onKeyDown = (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            navigateToFeature()
          }
          props.role = 'link'
          props.tabIndex = 0
          props['aria-current'] = activeNav === itemIndex ? 'location' : undefined
          props.className = `${className.replace(/\sactive\b/g, '')}${activeNav === itemIndex ? ' active' : ''}`
        }

        if (classes.includes('pill')) {
          const itemIndex = pillIndex++
          const currentValue = selectedPills[itemIndex] ?? filterChoices[itemIndex][0]
          const label = itemIndex === 0 ? 'Choose project' : 'Choose period'
          if (itemIndex === 1) {
            return (
              <div className="filter-control filter-period">
                <select
                  className={`${className} filter-select`}
                  aria-label={label}
                  value={currentValue}
                  onChange={(event) => {
                    const choice = event.currentTarget.value
                    setSelectedPills((current) => current.map((value, index) => index === itemIndex ? choice : value))
                  }}
                >
                  {filterChoices[itemIndex].map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                </select>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
            )
          }
          return (
            <div className="filter-control">
              <button
                type="button"
                className={`${className}${openPill === itemIndex ? ' on' : ''}`}
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={openPill === itemIndex}
                onClick={() => setOpenPill((current) => current === itemIndex ? null : itemIndex)}
              >
                <span>{currentValue}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
              {openPill === itemIndex && (
                <div className="filter-options" role="listbox" aria-label={label}>
                  {filterChoices[itemIndex].map((choice) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={choice === currentValue}
                      className={choice === currentValue ? 'selected' : ''}
                      key={choice}
                      onClick={() => {
                        setSelectedPills((current) => current.map((value, index) => index === itemIndex ? choice : value))
                        setOpenPill(null)
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        }

        if (classes.includes('an2-x')) {
          const index = analyticsAxisIndex++
          if (months.includes(selectedPills[1])) {
            return cloneElement(element, {}, `Week ${index + 1}`)
          }
        }

        if (classes.includes('an2-sub') && node.children?.length) {
          const subtitle = getNodeText(node).trim()
          if (subtitle === 'Bookings and pipeline value, last six months') {
            const monthSelected = months.includes(selectedPills[1])
            const text = monthSelected
              ? `Weekly bookings and pipeline value · ${selectedPills[1]}`
              : selectedPills[1] === 'Last Year'
                ? 'Bookings and pipeline value, last year'
                : 'Bookings and pipeline value, year to date'
            return cloneElement(element, {}, text)
          }
        }

        if (classes.includes('an2-bar')) {
          const index = analyticsBarIndex++
          const project = selectedPills[0] ?? 'All Projects'
          const period = selectedPills[1] ?? 'This Year'
          const selectedMonth = months.indexOf(period)
          const monthlyTotal = selectedMonth >= 0 ? monthlyBookingTotals[project]?.[selectedMonth] ?? 0 : 0
          const weeklyValues = weekShares.map((share) => Math.round(monthlyTotal * share))
          const values = selectedMonth >= 0
            ? weeklyValues
            : analyticsBookings[project]?.[period] ?? analyticsBookings['All Projects']['This Year']
          const count = values[index] ?? 0
          const maximum = Math.max(...values)
          const month = selectedMonth >= 0
            ? `Week ${index + 1}`
            : node.attribs['data-tip']?.split(' · ')[0] ?? `Month ${index + 1}`
          return cloneElement(element, {
            style: { ...element.props.style, '--h': `${Math.round((count / maximum) * 100)}%` },
            'data-tip': `${month} · ${count} bookings`,
            'aria-label': selectedMonth >= 0
              ? `${month} of ${period}: ${count} bookings for ${project}`
              : `${month}: ${count} bookings for ${project}, ${period}`,
          }, domToReact(node.children, options))
        }

        if (id === 'miniTrend') {
          return cloneElement(element, {}, <MiniTrendChart />)
        }

        if (id === 'srcDonut') {
          return cloneElement(element, {}, <SourceDonut />)
        }

        if (id === 'analytics') {
          return (
            <>
              {cloneElement(element, props, domToReact(node.children, options))}
              <PricingSection />
            </>
          )
        }

        if (classes.includes('dt-export')) {
          return (
            <button type="button" className={className} aria-label="Export pipeline leads" onClick={exportPipeline}>
              {domToReact(node.children)}
            </button>
          )
        }

        if (classes.includes('kpi-spark')) {
          return cloneElement(element, {}, <Sparkline color={node.attribs['data-color']} seed={Number(node.attribs['data-seed'])} />)
        }

        if (!Object.keys(props).length) return undefined
        if (node.children?.length) props.children = domToReact(node.children, options)
        return cloneElement(element, props)
      },
    }
  })()

  if (!signedIn) {
    return (
      <LoginScreen
        onLogin={() => {
          window.sessionStorage.setItem('zevro-demo-auth', 'signed-in')
          setSignedIn(true)
        }}
      />
    )
  }

  return (
    <>
      {parse(pageMarkup, options)}
      <SalesAgentWidget />
    </>
  )
}

export default App
