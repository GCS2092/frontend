import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'
import Modal from '../ui/Modal'
import { toast, confirmDialog } from '../ui/feedback'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

export default function Categories() {
  const { data, error, loading, reload } = useApi('/categories')
  const list = rows(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const openCreate = () => { setEditing(null); setName(''); setOpen(true) }
  const openEdit = (c) => { setEditing(c); setName(c.name || ''); setOpen(true) }

  const save = async (e) => {
    e.preventDefault()
    const n = name.trim()
    if (n.length < 2) return toast.error('Nom trop court (2 caractères minimum)')
    setBusy(true)
    try {
      if (editing) { await api.put(`/categories/${editing.id}`, { name: n }); toast.success('Catégorie modifiée') }
      else { await api.post('/categories', { name: n, slug: slugify(n) }); toast.success(`Catégorie « ${n} » créée`) }
      setOpen(false); reload()
    } catch (er) { toast.error(errMsg(er)) }
    finally { setBusy(false) }
  }

  const remove = async (c) => {
    const ok = await confirmDialog({
      title: `Supprimer « ${c.name} » ?`, message: 'Le serveur peut refuser si des produits utilisent encore cette catégorie.',
      danger: true, confirmLabel: 'Supprimer',
    })
    if (!ok) return
    try { await api.delete(`/categories/${c.id}`); toast.success('Catégorie supprimée'); reload() }
    catch (er) { toast.error(errMsg(er)) }
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>Catégories</h1><p className="page-sub">Regroupez les produits pour les retrouver plus vite.</p></div>
        <button type="button" onClick={openCreate}><Plus size={16} /> Nouvelle catégorie</button>
      </div>
      <Msg text={error} /><Loading on={loading} />
      <DataTable list={list} max={4} actions={(c) => (
        <div className="row-actions">
          <button type="button" className="ghost icon-btn" title="Modifier" aria-label="Modifier" onClick={() => openEdit(c)}><Pencil size={14} /></button>
          <button type="button" className="ghost icon-btn danger-text" title="Supprimer" aria-label="Supprimer" onClick={() => remove(c)}><Trash2 size={14} /></button>
        </div>
      )} />
      {!loading && <Empty list={list} />}

      <Modal open={open} onOpenChange={setOpen} size="sm" title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        footer={<>
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Annuler</button>
          <button type="submit" form="cat-form" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </>}>
        <form id="cat-form" onSubmit={save}>
          <label>Nom<input value={name} onChange={(e) => setName(e.target.value)} autoFocus required /></label>
        </form>
      </Modal>
    </div>
  )
}