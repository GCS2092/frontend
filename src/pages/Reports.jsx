import { useState } from 'react'
import { FileDown, Mail } from 'lucide-react'
import api, { download, errMsg } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Msg } from '../components/ui'
import { toast } from '../ui/feedback'

const iso = (d) => d.toISOString().slice(0, 10)
const now = new Date()

export default function Reports() {
  const { storeId, user } = useAuth()
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [to, setTo] = useState(iso(now))
  const [email, setEmail] = useState(user?.email || '')
  const [msg, setMsg] = useState('')
  const run = async (fn, ok) => {
    setMsg('')
    try { await fn(); if (ok) toast.success(ok) } catch (e) { setMsg(errMsg(e)) }
  }
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Rapports</h1>
          <p className="page-sub">PDF de la période, pour la boutique sélectionnée.</p>
        </div>
      </div>
      <Msg text={msg} />
      <div className="card">
        <div className="form-grid">
          <label>Du<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>Au<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        <div className="row">
          <button type="button" onClick={() => run(() => download('/admin/reports/download', `rapport-${from}-${to}.pdf`, { storeId, from, to }), 'Téléchargement lancé.')}><FileDown size={16} /> Télécharger le PDF</button>
        </div>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Envoyer par email</h2>
        <label>Destinataire
          <input type="email" placeholder="email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="button" className="ghost" disabled={!email}
          onClick={() => run(() => api.post('/admin/reports/send-email', { storeId, from, to, email }), 'Rapport envoyé par email.')}><Mail size={16} /> Envoyer</button>
      </div>
    </div>
  )
}
