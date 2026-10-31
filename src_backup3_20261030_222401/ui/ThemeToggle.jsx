import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
export default function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return (
    <button className="ui-btn ui-btn-ghost" onClick={() => setDark(d => !d)} aria-label="Changer de thème">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
