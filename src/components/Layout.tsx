import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import logoEasterEgg from '../assets/easter-egg.png'
import ggLogo from '../assets/gg-logo.svg'
import logo from '../assets/gul-og-gratis-logo.png'
import tiktokEasterEgg from '../assets/tiktok-easter-egg.jpg'
import Footer from './Footer'

const EASTER_EGG_CLICKS = 3
const EASTER_EGG_WINDOW_MS = 1000

function Layout() {
  const { pathname } = useLocation()
  // Which easter egg, if any, has replaced the GG background
  const [easterEgg, setEasterEgg] = useState<'logo' | 'tiktok' | null>(null)
  const logoClicks = useRef<number[]>([])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  function handleLogoClick() {
    if (easterEgg === 'logo') return
    const now = Date.now()
    logoClicks.current = [...logoClicks.current.filter((time) => now - time < EASTER_EGG_WINDOW_MS), now]
    if (logoClicks.current.length >= EASTER_EGG_CLICKS) {
      logoClicks.current = []
      setEasterEgg('logo')
    }
  }

  function handleTiktokClick() {
    setEasterEgg((current) => (current === 'tiktok' ? null : 'tiktok'))
  }

  return (
    <>
      <main className="relative min-h-screen bg-page-background px-4 pt-16 pb-24 text-text-primary sm:py-20">
        {easterEgg ? (
          <div
            key={easterEgg}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100 transition-opacity duration-500 starting:opacity-0 motion-reduce:transition-none"
            style={{ backgroundImage: `url(${easterEgg === 'tiktok' ? tiktokEasterEgg : logoEasterEgg})` }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
          >
            <img src={ggLogo} alt="" className="w-[min(110vw,1100px)] max-w-none -rotate-12 opacity-[0.07]" />
          </div>
        )}
        {/* The easter egg is pointer-only on purpose, so the logo is not keyboard-operable. */}
        <img
          src={logo}
          alt="Gul&Gratis"
          className="absolute top-4 right-4 h-4 sm:top-6 sm:right-6 sm:h-6"
          onClick={handleLogoClick}
        />
        <Outlet />
      </main>
      <Footer onTiktokClick={handleTiktokClick} />
    </>
  )
}

export default Layout
