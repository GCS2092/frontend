import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import TOURS from './tours'

const get = (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } }
const put = (k, v) => { try { localStorage.setItem(k, v) } catch { /* stockage indisponible */ } }
const readSeen = () => { try { return JSON.parse(get('guide-seen', '{}')) || {} } catch { return {} } }

export default function PageGuide() {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/$/, '') || '/'
  const tour = TOURS[path]
  const active = useRef(null)

  const stop = () => { try { active.current?.destroy() } catch { /* déjà fermé */ } active.current = null }

  const start = () => {
    if (!tour) return
    stop()
    const steps = [{ popover: { title: tour.title, description: tour.purpose } }]
    tour.steps.forEach(([sel, title, text, side]) => {
      const el = document.querySelector(sel)
      if (el) steps.push({ element: el, popover: { title, description: text, side: side || 'bottom', align: 'start' } })
    })
    const d = driver({
      showProgress: true, progressText: '{{current}} sur {{total}}',
      nextBtnText: 'Suivant', prevBtnText: 'Précédent', doneBtnText: 'Terminer',
      allowClose: true, overlayOpacity: 0.55, stagePadding: 6, stageRadius: 8, popoverClass: 'sgb-tour',
      steps,
      onPopoverRender: (popover) => {
        if (popover.wrapper.querySelector('.tour-pref')) return
        const label = document.createElement('label')
        label.className = 'tour-pref'
        const box = document.createElement('input')
        box.type = 'checkbox'
        box.checked = get('guide-mode', 'first') === 'never'
        box.onchange = () => put('guide-mode', box.checked ? 'never' : 'first')
        label.append(box, ' Ne plus ouvrir automatiquement')
        popover.description.after(label)
      },
      onDestroyed: () => { active.current = null },
    })
    active.current = d
    d.drive()
  }

  useEffect(() => {
    stop()
    if (!tour) return undefined
    const mode = get('guide-mode', 'first')
    const should = mode === 'always' || (mode === 'first' && !readSeen()[path])
    if (!should) return undefined
    const t = setTimeout(() => {
      start()
      const seen = readSeen(); seen[path] = 1; put('guide-seen', JSON.stringify(seen))
    }, 1000)
    return () => { clearTimeout(t); stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  if (!tour) return null
  return (
    <button type="button" className="ghost tool-btn" title="Visite guidée de cette page" onClick={start}>
      <HelpCircle size={16} /> <span className="guide-btn-label">Guide</span>
    </button>
  )
}