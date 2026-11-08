import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import { toast, confirmDialog } from '../ui/feedback'

function Detail({ id, onDone }) {
  const { data, error, loading, reload } = useApi(`/admin/inventory/${id}`)
  const [counts, setCounts] = useState({})
  const [msg, setMsg] = useState('')
  const lines = data?.lines || []
  const open = data?.status === 'OPEN'
  const key = (l) => `${l.productId}|${l.variantId || ''}`

  const persist = async () => {
    const payload = Object.entries(counts).filter(([, v]) => v !== '').map(([k, v]) => {
      const [productId, variantId] = k.split('|')
      return { productId, variantId: variantId || null, countedQty: Number(v) }
    })
    if (!payload.length) return false
    await api.put(`/admin/inventory/${id}/count`, { counts: payload })
    setCounts({})
    return true
  }
  const save = async () => {
    setMsg('')
    try {
      const wrote = await persist()
      if (!wrote) return toast.error('Saisissez au moins une quantité comptée.')
      reload(); toast.success('Comptage enregistré.')
    } catch (e) { setMsg(errMsg(e)) }
  }
  const validate = async () => {
    const ok = await confirmDialog({ title: 'Valider cet inventaire ?', message: 'Les écarts seront appliqués au stock.', confirmLabel: 'Valider' })
    if (!ok) return
    setMsg('')
    try {
      await persist()
      const { data: r } = await api.post(`/admin/inventory/${id}/validate`)
      toast.success(`Validé : ${r.adjusted} ajustement(s), +${r.gains} / -${r.losses}`)
      reload(); onDone()
    } catch (e) { setMsg(errMsg(e)) }
  }
  const cancel = async () => {
    const ok = await confirmDialog({ title: 'Annuler cet inventaire ?', message: 'Les comptages non validés seront ignorés.', danger: true, confirmLabel: 'Annuler l’inventaire' })
    if (!ok) return
    try { await api.patch(`/admin/inventory/${id}/cancel`, {}); toast.success('Inventaire annulé'); reload(); onDone() } catch (e) { setMsg(errMsg(e)) }
  }

  return (
    <div className="card">
      <h2>{data?.number} <Badge>{data?.status}</Badge></h2>
      <Msg text={error || msg} /><Loading on={loading} />
      <div className="table-wrap"><table className="dt">
        <thead><tr><th>Produit</th><th>Attendu</th><th>Compté</th><th>Écart</th></tr></thead>
        <tbody>{lines.map((l) => (
          <tr key={l.id}><td>{l.product?.name}{l.variant ? ` (${l.variant.size}/${l.variant.color})` : ''}</td><td>{l.expectedQty}</td>
            <td>{open ? <input className="num" type="number" min="0" placeholder={l.countedQty ?? ''} value={counts[key(l)] ?? ''} onChange={(e) => setCounts({ ...counts, [key(l)]: e.target.value })} /> : l.countedQty}</td>
            <td>{l.appliedDiff ?? ''}</td></tr>
        ))}</tbody>
      </table></div>
      {open && <div className="row"><button type="button" onClick={save}>Enregistrer le comptage</button><button type="button" onClick={validate}>Valider l’inventaire</button><button type="button" className="ghost" onClick={cancel}>Annuler</button></div>}
    </div>
  )
}

export default function Inventory() {
  const { storeId } = useAuth()
  const inv = useApi('/admin/inventory', { storeId })
  const [sel, setSel] = useState('')
  const [msg, setMsg] = useState('')
  const list = rows(inv.data)
  const create = async () => {
    setMsg('')
    try { const { data } = await api.post('/admin/inventory', { storeId }); inv.reload(); setSel(data.id) } catch (e) { setMsg(errMsg(e)) }
  }
  return (
    <div>
      <div className="page-head">
        <div><h1>Inventaires</h1><p className="page-sub">Comptez le stock réel, puis validez les écarts.</p></div>
        <button type="button" onClick={create}>Nouvel inventaire</button>
      </div>
      <Msg text={inv.error || msg} />
      <Loading on={inv.loading} />
      <div className="table-wrap"><table className="dt">
        <thead><tr><th>N°</th><th>Date</th><th>Lignes</th><th>Statut</th><th></th></tr></thead>
        <tbody>{list.map((x) => (
          <tr key={x.id}><td>{x.number}</td><td>{new Date(x.createdAt).toLocaleDateString('fr-FR')}</td><td>{x._count?.lines}</td><td><Badge>{x.status}</Badge></td>
            <td><button className="link" onClick={() => setSel(x.id)}>Ouvrir</button></td></tr>
        ))}</tbody>
      </table></div>
      <Empty list={list} />
      {sel && <Detail key={sel} id={sel} onDone={inv.reload} />}
    </div>
  )
}