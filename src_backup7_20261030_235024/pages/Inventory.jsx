import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'

function Detail({ id, onDone }) {
  const { data, error, loading, reload } = useApi(`/admin/inventory/${id}`)
  const [counts, setCounts] = useState({})
  const [msg, setMsg] = useState('')
  const lines = data?.lines || []
  const open = data?.status === 'OPEN'
  const key = (l) => `${l.productId}|${l.variantId || ''}`

  const save = async () => {
    const payload = Object.entries(counts).filter(([, v]) => v !== '').map(([k, v]) => {
      const [productId, variantId] = k.split('|')
      return { productId, variantId: variantId || null, countedQty: Number(v) }
    })
    if (!payload.length) return
    try { await api.put(`/admin/inventory/${id}/count`, { counts: payload }); setCounts({}); reload(); setMsg('Comptage enregistré.') } catch (e) { setMsg(errMsg(e)) }
  }
  const validate = async () => {
    try { await save(); const { data: r } = await api.post(`/admin/inventory/${id}/validate`); setMsg(`Validé : ${r.adjusted} ajustement(s), +${r.gains} / -${r.losses}`); reload(); onDone() } catch (e) { setMsg(errMsg(e)) }
  }
  const cancel = async () => { try { await api.patch(`/admin/inventory/${id}/cancel`, {}); reload(); onDone() } catch (e) { setMsg(errMsg(e)) } }

  return (
    <div className="card">
      <h2>{data?.number} <Badge>{data?.status}</Badge></h2>
      <Msg text={error || msg} /><Loading on={loading} />
      <table>
        <thead><tr><th>Produit</th><th>Attendu</th><th>Compté</th><th>Écart</th></tr></thead>
        <tbody>{lines.map((l) => (
          <tr key={l.id}><td>{l.product?.name}{l.variant ? ` (${l.variant.size}/${l.variant.color})` : ''}</td><td>{l.expectedQty}</td>
            <td>{open ? <input className="num" type="number" min="0" placeholder={l.countedQty ?? ''} value={counts[key(l)] ?? ''} onChange={(e) => setCounts({ ...counts, [key(l)]: e.target.value })} /> : l.countedQty}</td>
            <td>{l.appliedDiff ?? ''}</td></tr>
        ))}</tbody>
      </table>
      {open && <div className="row"><button onClick={save}>Enregistrer le comptage</button><button onClick={validate}>Valider l’inventaire</button><button className="ghost" onClick={cancel}>Annuler</button></div>}
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
      <h1>Inventaires</h1>
      <Msg text={inv.error || msg} />
      <button onClick={create}>Nouvel inventaire pour cette boutique</button>
      <Loading on={inv.loading} />
      <table>
        <thead><tr><th>N°</th><th>Date</th><th>Lignes</th><th>Statut</th><th></th></tr></thead>
        <tbody>{list.map((x) => (
          <tr key={x.id}><td>{x.number}</td><td>{new Date(x.createdAt).toLocaleDateString('fr-FR')}</td><td>{x._count?.lines}</td><td><Badge>{x.status}</Badge></td>
            <td><button className="link" onClick={() => setSel(x.id)}>Ouvrir</button></td></tr>
        ))}</tbody>
      </table>
      <Empty list={list} />
      {sel && <Detail key={sel} id={sel} onDone={inv.reload} />}
    </div>
  )
}