import { useState } from 'react'
import { Pencil, Plus, Power } from 'lucide-react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'
import Modal from '../ui/Modal'
import { toast } from '../ui/feedback'

const EMPTY = { name: '', phone: '', email: '' }

export default function Suppliers() {
  const sp = useApi('/admin/accounting/suppliers/all')
  const list = rows(sp.data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [f, setF] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const openCreate = () => { setEditing(null); setF(EMPTY); setOpen(true) }
  const openEdit = (r) => { setEditing(r); setF({ name: r.name ?? '', phone: r.phone ?? '', email: r.email ?? '' }); setOpen(true) }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editing) {
        await api.put(`/admin/accounting/suppliers/${editing.id}`, { name: f.name.trim(), phone: f.phone, email: f.email })
        toast.success('Fournisseur modifié')
      } else {
        await api.post('/admin/accounting/suppliers', { name: f.name.trim(), ...(f.phone && { phone: f.phone }), ...(f.email && { email: f.email }) })
        toast.success('Fournisseur ajouté')
      }
      setOpen(false); sp.reload()
    } catch (er) { toast.error(errMsg(er)) }
    finally { setBusy(false) }
  }

  const toggle = async (r) => {
    try { await api.patch(`/admin/accounting/suppliers/${r.id}/toggle`, {}); toast.success('Statut modifié'); sp.reload() }
    catch (er) { toast.error(errMsg(er)) }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Fournisseurs</h1>
        <button type="button" onClick={openCreate}><Plus size={16} /> Nouveau fournisseur</button>
      </div>
      <Msg text={sp.error} /><Loading on={sp.loading} />
      <DataTable list={list} actions={(r) => (
        <div className="row-actions">
          <button type="button" className="ghost icon-btn" title="Modifier" aria-label="Modifier" onClick={() => openEdit(r)}><Pencil size={14} /></button>
          <button type="button" className="ghost icon-btn" title="Activer / désactiver" aria-label="Activer ou désactiver" onClick={() => toggle(r)}><Power size={14} /></button>
        </div>
      )} />
      {!sp.loading && <Empty list={list} />}

      <Modal open={open} onOpenChange={setOpen} size="sm" title={editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        footer={<>
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Annuler</button>
          <button type="submit" form="sup-form" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </>}>
        <form id="sup-form" onSubmit={save}>
          <label>Nom<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoFocus /></label>
          <label>Téléphone <span className="muted">(optionnel)</span><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
          <label>Email <span className="muted">(optionnel)</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        </form>
      </Modal>
    </div>
  )
}