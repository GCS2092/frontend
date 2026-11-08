import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import Pager from '../components/Pager'
import { toast, confirmDialog } from '../ui/feedback'

const TYPES = [
  ['IN', 'Entrée'], ['OUT_LOSS', 'Perte / casse'], ['OUT_RETURN', 'Retour fournisseur'],
  ['RETURN_IN', 'Retour client'], ['ADJUSTMENT', 'Ajustement (+)'], ['ADJUSTMENT_OUT', 'Ajustement (−)'],
]
const FILTER_TYPES = [...TYPES, ['OUT_SALE', 'Vente'], ['TRANSFER_OUT', 'Transfert sortant'], ['TRANSFER_IN', 'Transfert entrant']]
const NEEDS_REASON = ['OUT_LOSS', 'OUT_RETURN', 'ADJUSTMENT', 'ADJUSTMENT_OUT']
const PLUS = ['IN', 'RETURN_IN', 'TRANSFER_IN', 'ADJUSTMENT']
const vLabel = (v) => [v.size, v.color].filter(Boolean).join(' / ') || 'Variante'
const NO_FILTER = { productId: '', type: '', from: '', to: '' }

export default function Stock() {
  const { storeId } = useAuth()
  const [page, setPage] = useState(1)
  const [flt, setFlt] = useState(NO_FILTER)
  const mv = useApi('/admin/accounting/stock-movements', {
    storeId, page, limit: 20,
    productId: flt.productId || undefined, type: flt.type || undefined,
    startDate: flt.from || undefined, endDate: flt.to || undefined,
  })
  const prods = useApi('/products/admin/all', { limit: 200 })
  const [f, setF] = useState({ productId: '', variantId: '', type: 'IN', quantity: '', unitCost: '', reason: '' })
  const [msg, setMsg] = useState('')
  const list = mv.data?.movements || []
  const prodList = rows(prods.data)
  const selected = prodList.find((p) => p.id === f.productId)
  const variants = selected?.variants || []
  const needsReason = NEEDS_REASON.includes(f.type)
  const pname = (id) => prodList.find((p) => p.id === id)?.name || id.slice(-6)
  const vname = (m) => (m.variant ? ` — ${vLabel(m.variant)}` : m.variantId ? ' — variante' : '')
  const upd = (k) => (e) => { setFlt({ ...flt, [k]: e.target.value }); setPage(1) }
  const filtered = Object.values(flt).some(Boolean)

  const submit = async (e) => {
    e.preventDefault(); setMsg('')
    if (variants.length && !f.variantId) return setMsg('Ce produit a des variantes : choisissez la variante concernée.')
    if (needsReason && f.reason.trim().length < 3) return setMsg('Un motif est obligatoire pour ce type de mouvement.')
    try {
      await api.post('/admin/accounting/stock-movements', {
        storeId, productId: f.productId, type: f.type, quantity: Number(f.quantity),
        ...(f.variantId && { variantId: f.variantId }),
        ...(f.unitCost && f.type === 'IN' && { unitCost: Number(f.unitCost) }),
        ...(f.reason.trim() && { reason: f.reason.trim() }),
      })
      setF({ ...f, quantity: '', unitCost: '', reason: '' }); toast.success('Mouvement enregistré'); mv.reload(); prods.reload()
    } catch (er) { setMsg(errMsg(er)) }
  }
  const cancel = async (id) => {
    const ok = await confirmDialog({ title: 'Annuler ce mouvement ?', message: 'Le stock sera recalculé dans l’autre sens.', danger: true, confirmLabel: 'Annuler le mouvement' })
    if (!ok) return
    try { await api.post(`/admin/accounting/stock-movements/${id}/cancel`); toast.success('Mouvement annulé'); mv.reload(); prods.reload() } catch (er) { setMsg(errMsg(er)) }
  }

  return (
    <div>
      <div className="page-head"><div><h1>Mouvements de stock</h1><p className="page-sub">Entrées, pertes, retours et ajustements de la boutique sélectionnée.</p></div></div>
      <Msg text={mv.error || msg} />
      <form className="card row" onSubmit={submit}>
        <select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value, variantId: '' })} required>
          <option value="">Produit…</option>
          {prodList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {variants.length > 0 && (
          <select value={f.variantId} onChange={(e) => setF({ ...f, variantId: e.target.value })} required>
            <option value="">Variante…</option>
            {variants.map((v) => <option key={v.id} value={v.id}>{vLabel(v)} (stock {v.stock})</option>)}
          </select>
        )}
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="number" min="1" step="1" placeholder="Quantité" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} required />
        {f.type === 'IN' && <input type="number" min="0" placeholder="Coût unitaire" value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: e.target.value })} />}
        <input placeholder={needsReason ? 'Motif (obligatoire)' : 'Motif'} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} required={needsReason} />
        <button>Enregistrer</button>
      </form>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <select aria-label="Filtrer par produit" value={flt.productId} onChange={upd('productId')}>
          <option value="">Tous les produits</option>
          {prodList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select aria-label="Filtrer par type" value={flt.type} onChange={upd('type')}>
          <option value="">Tous les types</option>
          {FILTER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Du
          <input type="date" value={flt.from} onChange={upd('from')} />
        </label>
        <label className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Au
          <input type="date" value={flt.to} onChange={upd('to')} />
        </label>
        {filtered && <button type="button" className="ghost" onClick={() => { setFlt(NO_FILTER); setPage(1) }}>Réinitialiser</button>}
        <span className="small muted">{mv.data?.total ?? 0} mouvement(s)</span>
      </div>

      <Loading on={mv.loading} />
      <div className="table-wrap"><table className="dt">
        <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th className="r">Qté</th><th>Motif</th><th></th></tr></thead>
        <tbody>{list.map((m) => (
          <tr key={m.id}><td>{new Date(m.createdAt).toLocaleString('fr-FR')}</td><td>{(m.product?.name || pname(m.productId)) + vname(m)}</td>
            <td><Badge>{m.type}</Badge></td>
            <td className="r">{PLUS.includes(m.type) ? '+' : '−'}{m.quantity}</td>
            <td>{m.reason || ''}</td>
            <td>{!String(m.reference || '').startsWith('CANCEL:') && <button className="link" onClick={() => cancel(m.id)}>Annuler</button>}</td></tr>
        ))}</tbody>
      </table></div>
      <Pager data={mv.data} page={page} setPage={setPage} />
      {!mv.loading && <Empty list={list} />}
    </div>
  )
}