import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import ggLogo from '../assets/gg-logo.svg'
import logo from '../assets/gul-og-gratis-logo.png'
import { GUL_OG_GRATIS_URL } from '../content'
import Footer from './Footer'

function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <main className="relative min-h-screen bg-page-background px-4 pt-16 pb-24 text-text-primary sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
        >
          <img src={ggLogo} alt="" className="w-[min(110vw,1100px)] max-w-none -rotate-12 opacity-[0.07]" />
        </div>
        <a href={GUL_OG_GRATIS_URL} className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <img src={logo} alt="Gul&Gratis" className="h-4 sm:h-6" />
        </a>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default Layout
