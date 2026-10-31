import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import Modal from './Modal'
import { GUIDE_SECTIONS } from '../pages/Help'

const get = (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } }
const put = (k, v) => { try { localStorage.setItem(k, v) } catch { /* stockage indisponible */ } }
const readSeen = () => { try { return JSON.parse(get('guide-seen', '{}')) || {} } catch { return {} } }

export default function PageGuide() {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/$/, '') || '/'
  const section = GUIDE_SECTIONS.find((s) => s.to === path && s.to !== '/login')
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState(() => get('guide-mode', 'first'))

  useEffect(() => {
    if (!section) { setOpen(false); return undefined }
    const should = mode === 'always' || (mode === 'first' && !readSeen()[path])
    if (!should) { setOpen(false); return undefined }
    const t = setTimeout(() => {
      setOpen(true)
      const seen = readSeen(); seen[path] = 1; put('guide-seen', JSON.stringify(seen))
    }, 350)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  const changeMode = (m) => { setMode(m); put('guide-mode', m) }

  if (!section) return null

  return (
    <>
      <button type="button" className="ghost tool-btn" title="Guide de cette page" onClick={() => setOpen(true)}>
        <HelpCircle size={16} /> <span className="guide-btn-label">Guide</span>
      </button>
      <Modal open={open} onOpenChange={setOpen} size="lg" title={`Guide : ${section.title}`} description={section.purpose}
        footer={<>
          <select className="guide-mode" aria-label="Affichage automatique" value={mode} onChange={(e) => changeMode(e.target.value)}>
            <option value="first">Première visite de chaque page</option>
            <option value="always">À chaque visite</option>
            <option value="never">Jamais automatiquement</option>
          </select>
          <Link to="/admin/help" className="guide-more" onClick={() => setOpen(false)}>Aide complète</Link>
          <button type="button" onClick={() => setOpen(false)}>Compris</button>
        </>}>
        <div className="guide-body">
          {section.blocks.map((b) => (
            <div key={b.h}>
              <h3 className="help-h3" style={{ marginTop: 0 }}>{b.h}</h3>
              <dl className="help-dl" style={{ marginBottom: 14 }}>
                {b.rows.map(([t, d]) => (<div key={t}><dt>{t}</dt><dd>{d}</dd></div>))}
              </dl>
            </div>
          ))}
          {section.tip && <div className="help-tip"><strong>À retenir :</strong> {section.tip}</div>}
        </div>
      </Modal>
    </>
  )
}