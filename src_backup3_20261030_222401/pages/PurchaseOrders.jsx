import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'

export default function PurchaseOrders() {
  const { storeId } = useAuth()
  const po = useApi('/admin/purchase-orders', { storeId })
  const sup = useApi('/admin/accounting/suppliers')
  const prods = useApi('/products/admin/all', { limit: 200 })
  const [f, setF] = useState({ supplierId: '', productId: '', quantity: '', unitCost: '' })
  const [msg, setMsg] = useState('')
  const list = rows(po.data)

  const act = async (fn) => { setMsg(''); try { await fn(); po.reload() } catch (er) { setMsg(errMsg(er)) } }
  const create = (e) => {
    e.preventDefault()
    act(async () => {
      await api.post('/admin/purchase-orders', { storeId, supplierId: f.supplierId, items: [{ productId: f.productId, quantity: Number(f.quantity), unitCost: Number(f.unitCost) }] })
      setF({ ...f, quantity: '', unitCost: '' })
    })
  }
  const receiveAll = (id) => act(async () => {
    const { data } = await api.get(`/admin/purchase-orders/${id}`)
    const lines = data.items.filter((i) => i.quantityOrdered > i.quantityReceived).map((i) => ({ itemId: i.id, quantity: i.quantityOrdered - i.quantityReceived }))
    if (lines.length) await api.post(`/admin/purchase-orders/${id}/receive`, { lines })
  })

  return (
    <div>
      <h1>Bons de commande</h1>
      <Msg text={po.error || msg} />
      <form className="card row" onSubmit={create}>
        <select value={f.supplierId} onChange={(e) => setF({ ...f, supplierId: e.target.value })} required>
          <option value="">Fournisseur…</option>
          {rows(sup.data).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })} required>
          <option value="">Produit…</option>
          {rows(prods.data).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="number" min="1" placeholder="Quantité" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} required />
        <input type="number" min="0" placeholder="Coût unitaire" value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: e.target.value })} required />
        <button>Créer le brouillon</button>
      </form>
      <Loading on={po.loading} />
      <table>
        <thead><tr><th>N°</th><th>Fournisseur</th><th>Lignes</th><th>Statut</th><th></th></tr></thead>
        <tbody>{list.map((x) => (
          <tr key={x.id}><td>{x.poNumber}</td><td>{x.supplier?.name}</td><td>{x._count?.items}</td><td><Badge>{x.status}</Badge></td>
            <td>
              {x.status === 'DRAFT' && <button className="link" onClick={() => act(() => api.patch(`/admin/purchase-orders/${x.id}/send`, {}))}>Envoyer</button>}
              {['ORDERED', 'PARTIAL'].includes(x.status) && <button className="link" onClick={() => receiveAll(x.id)}>Tout recevoir</button>}
              {['DRAFT', 'ORDERED'].includes(x.status) && <button className="link" onClick={() => act(() => api.patch(`/admin/purchase-orders/${x.id}/cancel`, {}))}>Annuler</button>}
            </td></tr>
        ))}</tbody>
      </table>
      <Empty list={list} />
    </div>
  )
}