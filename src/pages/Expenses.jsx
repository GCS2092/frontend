import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'

const CATS = ['STOCK_PURCHASE', 'SHIPPING', 'MARKETING', 'PACKAGING', 'SALARY', 'RENT', 'UTILITIES', 'OTHER']
const today = () => new Date().toISOString().slice(0, 10)

export default function Expenses() {
  const { storeId } = useAuth()
  const ex = useApi('/admin/accounting/expenses', { storeId })
  const [f, setF] = useState({ label: '', amount: '', category: 'OTHER', date: today() })
  const [msg, setMsg] = useState('')
  const list = rows(ex.data)
  const act = async (fn) => { setMsg(''); try { await fn(); ex.reload() } catch (e) { setMsg(errMsg(e)) } }
  const create = (e) => {
    e.preventDefault()
    act(async () => {
      await api.post('/admin/accounting/expenses', { storeId, label: f.label, amount: Number(f.amount), category: f.category, date: f.date })
      setF({ ...f, label: '', amount: '' })
    })
  }
  return (
    <div>
      <h1>Dépenses</h1>
      <Msg text={ex.error || msg} />
      <form className="card row" onSubmit={create}>
        <input placeholder="Libellé" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} required />
        <input type="number" min="0" placeholder="Montant" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required />
        <button>Ajouter</button>
      </form>
      <Loading on={ex.loading} />
      <DataTable list={list} actions={(r) => <button className="link" onClick={() => window.confirm('Supprimer cette dépense ?') && act(() => api.delete(`/admin/accounting/expenses/${r.id}`))}>Supprimer</button>} />
      <Empty list={list} />
    </div>
  )
}
