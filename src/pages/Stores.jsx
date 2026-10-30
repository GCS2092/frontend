import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'

export default function Stores() {
  const st = useApi('/admin/stores')
  const [f, setF] = useState({ name: '', code: '' })
  const [msg, setMsg] = useState('')
  const list = rows(st.data)
  const act = async (fn) => { setMsg(''); try { await fn(); st.reload() } catch (e) { setMsg(errMsg(e)) } }
  const create = (e) => {
    e.preventDefault()
    act(async () => { await api.post('/admin/stores', { name: f.name, code: f.code.toUpperCase() }); setF({ name: '', code: '' }) })
  }
  return (
    <div>
      <h1>Boutiques</h1>
      <Msg text={st.error || msg} />
      <form className="card row" onSubmit={create}>
        <input placeholder="Nom" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <input placeholder="Code (ex : DKR)" maxLength={6} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} required />
        <button>Créer la boutique</button>
      </form>
      <Loading on={st.loading} />
      <DataTable list={list} actions={(r) => (
        <button className="link" onClick={() => act(() => api.patch(`/admin/stores/${r.id}`, { isActive: !r.isActive }))}>
          {r.isActive ? 'Désactiver' : 'Activer'}
        </button>
      )} />
      <Empty list={list} />
    </div>
  )
}
