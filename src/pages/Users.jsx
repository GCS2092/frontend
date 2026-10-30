import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'
import Pager from '../components/Pager'

const ROLES = ['CUSTOMER', 'SELLER', 'STAFF', 'ADMIN']
const STORE_ROLES = ['MANAGER', 'ACCOUNTANT', 'COMMERCIAL', 'WAREHOUSE', 'DELIVERY']
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', password: '', storeId: '', storeRole: 'COMMERCIAL' }

export default function Users() {
  const { user: me, stores } = useAuth()
  const [page, setPage] = useState(1)
  const u = useApi('/users/admin/all', { page, limit: 50 })
  const [f, setF] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const list = rows(u.data)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const act = async (fn, ok) => { setMsg(''); try { await fn(); if (ok) setMsg(ok); u.reload() } catch (e) { setMsg(errMsg(e)) } }

  const create = (e) => {
    e.preventDefault()
    if (f.password.length < 10) return setMsg('Mot de passe : 10 caractères minimum.')
    act(async () => {
      await api.post('/users/admin/staff', {
        firstName: f.firstName, lastName: f.lastName, email: f.email, password: f.password,
        ...(f.phone && { phone: f.phone }),
        ...(f.storeId && { storeId: f.storeId, storeRole: f.storeRole }),
      })
      setF(EMPTY)
    }, 'Compte créé.')
  }
  const changeRole = (r, role) => {
    if (r.id === me.id) return setMsg('Vous ne pouvez pas changer votre propre rôle.')
    if (window.confirm(`Passer ${r.email} en ${role} ?`)) act(() => api.put(`/users/admin/${r.id}/role`, { role }), 'Rôle modifié.')
  }
  const resetPwd = (r) => {
    const p = window.prompt(`Nouveau mot de passe pour ${r.email} (10 caractères min.)`)
    if (!p) return
    if (p.length < 10) return setMsg('Mot de passe trop court.')
    act(() => api.put(`/users/admin/${r.id}/password`, { password: p }), 'Mot de passe mis à jour.')
  }

  return (
    <div>
      <h1>Utilisateurs</h1>
      <Msg text={u.error || msg} />
      <form className="card row" onSubmit={create}>
        <input placeholder="Prénom" value={f.firstName} onChange={set('firstName')} required />
        <input placeholder="Nom" value={f.lastName} onChange={set('lastName')} required />
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input placeholder="Téléphone" value={f.phone} onChange={set('phone')} />
        <input type="password" placeholder="Mot de passe" autoComplete="new-password" value={f.password} onChange={set('password')} required />
        <select value={f.storeId} onChange={set('storeId')}>
          <option value="">Boutique (optionnel)…</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={f.storeRole} onChange={set('storeRole')}>
          {STORE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button>Créer le compte</button>
      </form>
      <Loading on={u.loading} />
      <DataTable list={list} actions={(r) => (
        <span className="row">
          <select value={r.role} onChange={(e) => changeRole(r, e.target.value)}>
            {ROLES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <button className="link" onClick={() => resetPwd(r)}>Mot de passe</button>
        </span>
      )} />
      <Pager data={u.data} page={page} setPage={setPage} />
      <Empty list={list} />
    </div>
  )
}
