import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import api, { rows } from '../api/axios'

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const box = useRef(null)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { limit: 15 } })
      setList(rows(data))
    } catch { /* silencieux : la cloche ne doit jamais bloquer l'écran */ }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const unread = list.filter((n) => !n.isRead).length

  const openItem = async (n) => {
    setOpen(false)
    if (!n.isRead) {
      setList((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
      try { await api.put(`/notifications/${n.id}/read`) } catch { /* ignore */ }
    }
    if (n.link && n.link.startsWith('/admin')) navigate(n.link)
  }
  const readAll = async () => {
    setList((l) => l.map((x) => ({ ...x, isRead: true })))
    try { await api.put('/notifications/read-all') } catch { /* ignore */ }
  }

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button type="button" className="ghost" aria-label="Notifications" title="Notifications" onClick={() => { setOpen(!open); if (!open) load() }} style={{ padding: '7px 9px', position: 'relative' }}>
        <Bell size={16} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -3, right: -3, background: 'var(--danger)', color: '#fff', fontSize: 10, lineHeight: '16px', minWidth: 16, borderRadius: 8, padding: '0 4px', textAlign: 'center' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="z-50 rounded-xl border border-border bg-surface shadow-xl" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, width: 340, maxWidth: '90vw', maxHeight: 420, overflow: 'auto', padding: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 8px' }}>
            <strong style={{ fontSize: 13 }}>Notifications</strong>
            {unread > 0 && <button type="button" className="link" onClick={readAll}><CheckCheck size={13} /> Tout marquer lu</button>}
          </div>
          {!list.length && <p className="small muted" style={{ padding: 8 }}>Aucune notification.</p>}
          {list.map((n) => (
            <button key={n.id} type="button" className="ghost" onClick={() => openItem(n)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 2, opacity: n.isRead ? 0.6 : 1 }}>
              <div style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600 }}>{n.title}</div>
              <div className="small muted">{n.message}</div>
              <div className="small muted" style={{ fontSize: 11 }}>{new Date(n.createdAt).toLocaleString('fr-FR')}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}