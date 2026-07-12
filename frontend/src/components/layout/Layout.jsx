// App shell: responsive Sidebar + Topbar + content outlet.
// Built once in Phase 0. Each page renders inside <Outlet/>.
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './Layout.css'

export default function Layout() {
  const [open, setOpen] = useState(false) // mobile drawer

  // Keyboard shortcut: "/" focuses the page search box (when not typing).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const search = document.querySelector('.search-box input')
      if (search) { e.preventDefault(); search.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="app-main">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
