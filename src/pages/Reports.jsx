import { useState } from 'react'
import api, { download, errMsg } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Msg } from '../components/ui'

const iso = (d) => d.toISOString().slice(0, 10)
const now = new Date()

export default function Reports() {
  const { storeId, user } = useAuth()
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [to, setTo] = useState(iso(now))
  const [email, setEmail] = useState(user?.email || '')
  const [msg, setMsg] = useState('')
  const run = async (fn, ok) => { setMsg(''); try { await fn(); if (ok) setMsg(ok) } catch (e) { setMsg(errMsg(e)) } }
  return (
    <div>
      <h1>Rapports</h1>
      <Msg text={msg} />
      <div className="card row">
        <label className="small" style={{ margin: 0 }}>Du<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="small" style={{ margin: 0 }}>Au<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button onClick={() => run(() => download('/admin/reports/download', `rapport-${from}-${to}.pdf`, { storeId, from, to }))}>Télécharger le PDF</button>
      </div>
      <div className="card row">
        <input type="email" placeholder="Email du destinataire" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="ghost" style={{ color: '#111827', borderColor: '#9ca3af' }} disabled={!email}
          onClick={() => run(() => api.post('/admin/reports/send-email', { storeId, from, to, email }), 'Rapport envoyé par email.')}>Envoyer par email</button>
      </div>
    </div>
  )
}
