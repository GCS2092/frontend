import { useState } from 'react'
import { Pencil, Plus, Power, Star } from 'lucide-react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import Modal from '../ui/Modal'
import { toast, confirmDialog } from '../ui/feedback'

const EMPTY = { code: '', name: '', address: '', phone: '', taxRate: '0', discountRate: '0', currency: 'XOF', exchangeRate: '1', isMain: false }

export default function Stores() {
  const st = useApi('/admin/stores')
  const list = rows(st.data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [f, setF] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const openCreate = () => { setEditing(null); setF(EMPTY); setOpen(true) }
  const openEdit = (r) => {
    setEditing(r)
    setF({
      code: r.code ?? '', name: r.name ?? '', address: r.address ?? '', phone: r.phone ?? '',
      taxRate: String(r.taxRate ?? 0), discountRate: String(r.discountRate ?? 0),
      currency: r.currency ?? 'XOF', exchangeRate: String(r.exchangeRate ?? 1), isMain: !!r.isMain,
    })
    setOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const common = {
        name: f.name, address: f.address, phone: f.phone,
        taxRate: Number(f.taxRate), discountRate: Number(f.discountRate),
        currency: f.currency, exchangeRate: Number(f.exchangeRate),
      }
      if (editing) { await api.patch(`/admin/stores/${editing.id}`, common); toast.success('Boutique modifiée') }
      else { await api.post('/admin/stores', { code: f.code, ...common, isMain: f.isMain }); toast.success('Boutique créée') }
      setOpen(false); st.reload()
    } catch (er) { toast.error(errMsg(er)) }
    finally { setBusy(false) }
  }

  const setMain = async (r) => {
    const ok = await confirmDialog({ title: `Définir « ${r.name} » comme boutique principale ?`, confirmLabel: 'Confirmer' })
    if (!ok) return
    try { await api.patch(`/admin/stores/${r.id}`, { isMain: true }); toast.success('Boutique principale modifiée'); st.reload() }
    catch (er) { toast.error(errMsg(er)) }
  }
  const toggle = async (r) => {
    try { await api.patch(`/admin/stores/${r.id}`, { isActive: !r.isActive }); toast.success(r.isActive === false ? 'Boutique activée' : 'Boutique désactivée'); st.reload() }
    catch (er) { toast.error(errMsg(er)) }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Boutiques</h1>
        <button type="button" onClick={openCreate}><Plus size={16} /> Nouvelle boutique</button>
      </div>
      <Msg text={st.error} /><Loading on={st.loading} />
      {list.length > 0 && (
        <div className="table-wrap">
          <table className="dt">
            <thead><tr><th>Code</th><th>Nom</th><th>Téléphone</th><th className="r">TVA %</th><th>Devise</th><th>Statut</th><th></th></tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.name} {r.isMain && <Badge>principale</Badge>}</td>
                <td>{r.phone}</td>
                <td className="r">{r.taxRate}</td>
                <td>{r.currency}</td>
                <td><Badge>{r.isActive === false ? 'inactive' : 'active'}</Badge></td>
                <td className="actions-cell">
                  <div className="row-actions">
                    <button type="button" className="ghost icon-btn" title="Modifier" aria-label="Modifier" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                    {!r.isMain && <button type="button" className="ghost icon-btn" title="Définir comme principale" aria-label="Définir comme principale" onClick={() => setMain(r)}><Star size={14} /></button>}
                    <button type="button" className="ghost icon-btn" title={r.isActive === false ? 'Activer' : 'Désactiver'} aria-label="Activer ou désactiver" onClick={() => toggle(r)}><Power size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {!st.loading && <Empty list={list} />}

      <Modal open={open} onOpenChange={setOpen} size="lg" title={editing ? 'Modifier la boutique' : 'Nouvelle boutique'}
        footer={<>
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Annuler</button>
          <button type="submit" form="store-form" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </>}>
        <form id="store-form" onSubmit={save}>
          <div className="form-grid">
            <label>Code<input maxLength={6} value={f.code} onChange={set('code')} required disabled={!!editing} placeholder="ex : DKR" /></label>
            <label>Nom<input value={f.name} onChange={set('name')} required autoFocus={!editing} /></label>
            <label>Adresse<input value={f.address} onChange={set('address')} /></label>
            <label>Téléphone<input value={f.phone} onChange={set('phone')} /></label>
            <label>TVA %<input type="number" step="any" min="0" value={f.taxRate} onChange={set('taxRate')} /></label>
            <label>Remise %<input type="number" step="any" min="0" value={f.discountRate} onChange={set('discountRate')} /></label>
            <label>Devise<input maxLength={4} value={f.currency} onChange={set('currency')} /></label>
            <label>Taux de change<input type="number" step="any" min="0" value={f.exchangeRate} onChange={set('exchangeRate')} /></label>
          </div>
          {!editing && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={f.isMain} onChange={(e) => setF({ ...f, isMain: e.target.checked })} />
              Boutique principale
            </label>
          )}
        </form>
      </Modal>
    </div>
  )
}