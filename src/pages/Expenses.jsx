import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'
import Pager from '../components/Pager'
import Modal from '../ui/Modal'
import { toast, confirmDialog } from '../ui/feedback'

const CATS = {
  STOCK_PURCHASE: 'Achat de stock', SHIPPING: 'Livraison', MARKETING: 'Marketing', PACKAGING: 'Emballage',
  SALARY: 'Salaires', RENT: 'Loyer', UTILITIES: 'Charges', OTHER: 'Autre',
}
const today = () => new Date().toISOString().slice(0, 10)
const EMPTY = () => ({ label: '', amount: '', category: 'OTHER', date: today() })

export default function Expenses() {
  const { storeId } = useAuth()
  const [page, setPage] = useState(1)
  const ex = useApi('/admin/accounting/expenses', { storeId, page, limit: 20 })
  const list = rows(ex.data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [f, setF] = useState(EMPTY())
  const [busy, setBusy] = useState(false)

  const openCreate = () => { setEditing(null); setF(EMPTY()); setOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    setF({
      label: r.label ?? '', amount: String(r.amount ?? ''), category: r.category || 'OTHER',
      date: r.date ? String(r.date).slice(0, 10) : today(),
    })
    setOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!(Number(f.amount) >= 0) || f.amount === '') return toast.error('Montant invalide')
    setBusy(true)
    try {
      const body = { storeId, label: f.label.trim(), amount: Number(f.amount), category: f.category, date: f.date }
      if (editing) { await api.put(`/admin/accounting/expenses/${editing.id}`, body); toast.success('Dépense modifiée') }
      else { await api.post('/admin/accounting/expenses', body); toast.success('Dépense ajoutée') }
      setOpen(false); ex.reload()
    } catch (er) { toast.error(errMsg(er)) }
    finally { setBusy(false) }
  }

  const remove = async (r) => {
    const ok = await confirmDialog({
      title: 'Supprimer cette dépense ?', message: `« ${r.label || 'Dépense'} » sera supprimée définitivement.`,
      danger: true, confirmLabel: 'Supprimer',
    })
    if (!ok) return
    try { await api.delete(`/admin/accounting/expenses/${r.id}`); toast.success('Dépense supprimée'); ex.reload() }
    catch (er) { toast.error(errMsg(er)) }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Dépenses</h1>
        <button type="button" onClick={openCreate}><Plus size={16} /> Nouvelle dépense</button>
      </div>
      <Msg text={ex.error} /><Loading on={ex.loading} />
      <DataTable list={list} actions={(r) => (
        <div className="row-actions">
          <button type="button" className="ghost icon-btn" title="Modifier" aria-label="Modifier" onClick={() => openEdit(r)}><Pencil size={14} /></button>
          <button type="button" className="ghost icon-btn danger-text" title="Supprimer" aria-label="Supprimer" onClick={() => remove(r)}><Trash2 size={14} /></button>
        </div>
      )} />
      <Pager data={ex.data} page={page} setPage={setPage} />
      {!ex.loading && <Empty list={list} />}

      <Modal open={open} onOpenChange={setOpen} title={editing ? 'Modifier la dépense' : 'Nouvelle dépense'}
        footer={<>
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Annuler</button>
          <button type="submit" form="exp-form" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </>}>
        <form id="exp-form" onSubmit={save}>
          <label>Libellé<input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} required autoFocus /></label>
          <div className="form-grid">
            <label>Montant<input type="number" min="0" step="any" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required /></label>
            <label>Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></label>
          </div>
          <label>Catégorie
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {Object.entries(CATS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </form>
      </Modal>
    </div>
  )
}