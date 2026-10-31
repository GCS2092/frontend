import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import TOURS from './tours'
import NEXT from './tourNext'

const VERSION = 2
const get = (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } }
const put = (k, v) => { try { localStorage.setItem(k, v) } catch { /* stockage indisponible */ } }
const readSeen = () => { try { return JSON.parse(get('guide-seen', '{}')) || {} } catch { return {} } }
const visible = (el) => !!el && el.getClientRects().length > 0

export default function PageGuide() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
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
      if (visible(el)) steps.push({ element: el, popover: { title, description: text, side: side || 'bottom', align: 'start' } })
    })
    const total = steps.length
    const d = driver({
      showProgress: true, progressText: '{{current}} sur {{total}}',
      nextBtnText: 'Suivant', prevBtnText: 'Précédent', doneBtnText: 'Terminer',
      allowClose: true, allowKeyboardControl: true, overlayOpacity: 0.55, stagePadding: 6, stageRadius: 8,
      popoverClass: 'sgb-tour', steps,
      onPopoverRender: (popover) => {
        popover.wrapper.querySelectorAll('.tour-kicker, .tour-next, .tour-pref').forEach((n) => n.remove())
        const idx = d.getActiveIndex?.() ?? 0

        const kicker = document.createElement('div')
        kicker.className = 'tour-kicker'
        const n = total - 1
        kicker.textContent = idx === 0 ? `Visite guidée · ${n} étape${n > 1 ? 's' : ''}` : tour.title
        popover.title.before(kicker)

        const label = document.createElement('label')
        label.className = 'tour-pref'
        const box = document.createElement('input')
        box.type = 'checkbox'
        box.checked = get('guide-mode', 'first') === 'never'
        box.onchange = () => put('guide-mode', box.checked ? 'never' : 'first')
        label.append(box, ' Ne plus ouvrir automatiquement')
        popover.description.after(label)

        if (idx === total - 1 && NEXT[path]) {
          const b = document.createElement('button')
          b.type = 'button'
          b.className = 'tour-next'
          b.textContent = `Et ensuite : ${NEXT[path].label} →`
          b.onclick = () => { d.destroy(); navigate(NEXT[path].to) }
          popover.description.after(b)
        }
      },
      onDestroyed: () => { active.current = null },
    })
    active.current = d
    d.drive()
  }

  // Ouverture automatique : attend que la page soit réellement affichée
  useEffect(() => {
    stop()
    if (!tour) return undefined
    const mode = get('guide-mode', 'first')
    const should = mode === 'always' || (mode === 'first' && readSeen()[path] !== VERSION)
    if (!should) return undefined
    let dead = false
    let timer
    const t0 = Date.now()
    const ready = () => tour.steps.every(([sel]) => visible(document.querySelector(sel)))
    const tick = () => {
      if (dead) return
      if (ready() || Date.now() - t0 > 2500) {
        start()
        const seen = readSeen(); seen[path] = VERSION; put('guide-seen', JSON.stringify(seen))
        return
      }
      timer = setTimeout(tick, 200)
    }
    timer = setTimeout(tick, 500)
    return () => { dead = true; clearTimeout(timer); stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  // Touche « ? » : relance la visite (hors champ de saisie)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target?.tagName || '').toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag) || e.target?.isContentEditable) return
      start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  if (!tour) return null
  return (
    <button type="button" className="ghost tool-btn" title="Visite guidée de cette page (touche ?)" onClick={start}>
      <HelpCircle size={16} /> <span className="guide-btn-label">Guide</span>
    </button>
  )
}