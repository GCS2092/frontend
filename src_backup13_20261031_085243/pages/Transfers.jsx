import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'

export default function Transfers() {
  const { stores, storeId } = useAuth()
  const t = useApi('/admin/stock-transfers', { storeId })
  const prods = useApi('/products/admin/all', { limit: 200 })
  const [f, setF] = useState({ toStoreId: '', productId: '', quantity: '' })
  const [msg, setMsg] = useState('')
  const list = rows(t.data)

  const act = async (fn) => { setMsg(''); try { await fn(); t.reload() } catch (er) { setMsg(errMsg(er)) } }
  const create = (e) => {
    e.preventDefault()
    act(async () => {
      await api.post('/admin/stock-transfers', { fromStoreId: storeId, toStoreId: f.toStoreId, items: [{ productId: f.productId, quantity: Number(f.quantity) }] })
      setF({ ...f, quantity: '' })
    })
  }

  return (
    <div>
      <h1>Transferts entre boutiques</h1>
      <Msg text={t.error || msg} />
      <form className="card row" onSubmit={create}>
        <span className="muted small">De : {stores.find((s) => s.id === storeId)?.name}</span>
        <select value={f.toStoreId} onChange={(e) => setF({ ...f, toStoreId: e.target.value })} required>
          <option value="">Vers…</option>
          {stores.filter((s) => s.id !== storeId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })} required>
          <option value="">Produit…</option>
          {rows(prods.data).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="number" min="1" placeholder="Quantité" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} required />
        <button>Créer</button>
      </form>
      <Loading on={t.loading} />
      <table>
        <thead><tr><th>N°</th><th>Trajet</th><th>Articles</th><th>Statut</th><th></th></tr></thead>
        <tbody>{list.map((x) => (
          <tr key={x.id}><td>{x.transferNumber}</td><td>{x.fromStore?.name} → {x.toStore?.name}</td>
            <td>{x.items?.map((i) => `${i.product?.name} × ${i.quantity}`).join(', ')}</td><td><Badge>{x.status}</Badge></td>
            <td>{x.status === 'PENDING' && <>
              <button className="link" onClick={() => act(() => api.patch(`/admin/stock-transfers/${x.id}/validate`))}>Valider</button>{' '}
              <button className="link" onClick={() => act(() => api.patch(`/admin/stock-transfers/${x.id}/cancel`, {}))}>Annuler</button></>}</td></tr>
        ))}</tbody>
      </table>
      <Empty list={list} />
    </div>
  )
}