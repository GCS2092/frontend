import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'

export default function Suppliers() {
  const sp = useApi('/admin/accounting/suppliers/all')
  const [f, setF] = useState({ name: '', phone: '', email: '' })
  const [msg, setMsg] = useState('')
  const list = rows(sp.data)
  const act = async (fn) => { setMsg(''); try { await fn(); sp.reload() } catch (e) { setMsg(errMsg(e)) } }
  const create = (e) => {
    e.preventDefault()
    act(async () => {
      await api.post('/admin/accounting/suppliers', { name: f.name, ...(f.phone && { phone: f.phone }), ...(f.email && { email: f.email }) })
      setF({ name: '', phone: '', email: '' })
    })
  }
  return (
    <div>
      <h1>Fournisseurs</h1>
      <Msg text={sp.error || msg} />
      <form className="card row" onSubmit={create}>
        <input placeholder="Nom" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <input placeholder="Téléphone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <button>Ajouter</button>
      </form>
      <Loading on={sp.loading} />
      <DataTable list={list} actions={(r) => <button className="link" onClick={() => act(() => api.patch(`/admin/accounting/suppliers/${r.id}/toggle`, {}))}>Activer / désactiver</button>} />
      <Empty list={list} />
    </div>
  )
}
