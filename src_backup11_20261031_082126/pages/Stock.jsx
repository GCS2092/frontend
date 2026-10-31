import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'

const TYPES = [['IN', 'Entrée'], ['OUT_LOSS', 'Perte / casse'], ['OUT_RETURN', 'Retour fournisseur'], ['RETURN_IN', 'Retour client'], ['ADJUSTMENT', 'Ajustement (+)']]

export default function Stock() {
  const { storeId } = useAuth()
  const mv = useApi('/admin/accounting/stock-movements', { storeId, limit: 50 })
  const prods = useApi('/products/admin/all', { limit: 200 })
  const [f, setF] = useState({ productId: '', type: 'IN', quantity: '', unitCost: '', reason: '' })
  const [msg, setMsg] = useState('')
  const list = mv.data?.movements || []
  const pname = (id) => rows(prods.data).find((p) => p.id === id)?.name || id.slice(-6)

  const submit = async (e) => {
    e.preventDefault(); setMsg('')
    try {
      await api.post('/admin/accounting/stock-movements', {
        storeId, productId: f.productId, type: f.type, quantity: Number(f.quantity),
        ...(f.unitCost && { unitCost: Number(f.unitCost) }), ...(f.reason && { reason: f.reason }),
      })
      setF({ ...f, quantity: '', unitCost: '', reason: '' }); mv.reload(); prods.reload()
    } catch (er) { setMsg(errMsg(er)) }
  }
  const cancel = async (id) => {
    try { await api.post(`/admin/accounting/stock-movements/${id}/cancel`); mv.reload() } catch (er) { setMsg(errMsg(er)) }
  }

  return (
    <div>
      <h1>Mouvements de stock</h1>
      <Msg text={mv.error || msg} />
      <form className="card row" onSubmit={submit}>
        <select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })} required>
          <option value="">Produit…</option>
          {rows(prods.data).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="number" min="1" placeholder="Quantité" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} required />
        <input type="number" min="0" placeholder="Coût unitaire" value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: e.target.value })} />
        <input placeholder="Motif" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        <button>Enregistrer</button>
      </form>
      <Loading on={mv.loading} />
      <table>
        <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Qté</th><th>Motif</th><th></th></tr></thead>
        <tbody>{list.map((m) => (
          <tr key={m.id}><td>{new Date(m.createdAt).toLocaleString('fr-FR')}</td><td>{m.product?.name || pname(m.productId)}</td>
            <td><Badge>{m.type}</Badge></td><td>{m.quantity}</td><td>{m.reason || ''}</td>
            <td>{!String(m.reference || '').startsWith('CANCEL:') && <button className="link" onClick={() => cancel(m.id)}>Annuler</button>}</td></tr>
        ))}</tbody>
      </table>
      <Empty list={list} />
    </div>
  )
}