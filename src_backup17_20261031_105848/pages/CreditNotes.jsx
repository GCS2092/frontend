import { useState } from 'react'
import api, { errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'

const EMPTY = { invoiceId: '', amount: '', reason: '', restoreStock: false }

export default function CreditNotes() {
  const { storeId } = useAuth()
  const cn = useApi('/admin/credit-notes', { storeId })
  const inv = useApi('/admin/invoices', { storeId, limit: 100 })
  const [f, setF] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const list = rows(cn.data)
  const invoices = rows(inv.data).filter((i) => i.status !== 'CANCELLED')
  const picked = invoices.find((i) => i.id === f.invoiceId)

  const pick = (id) => {
    const i = invoices.find((x) => x.id === id)
    setF({ ...f, invoiceId: id, amount: i ? String(i.total) : '' })
  }

  const create = async (e) => {
    e.preventDefault(); setMsg('')
    if (!picked) return setMsg('Choisissez une facture.')
    const amount = Number(f.amount)
    if (!Number.isInteger(amount) || amount <= 0 || amount > picked.total) return setMsg(`Montant invalide (1 à ${picked.total}).`)
    if (!window.confirm(`Émettre un avoir de ${fmt(amount)} sur ${picked.invoiceNumber} ?\nLa facture sera ANNULÉE${f.restoreStock ? ' et le stock sera remis en vente' : ''}. Action irréversible.`)) return
    try {
      await api.post('/admin/credit-notes', { invoiceId: f.invoiceId, amount, reason: f.reason, restoreStock: f.restoreStock })
      setF(EMPTY); setMsg('Avoir émis.'); cn.reload(); inv.reload()
    } catch (er) { setMsg(errMsg(er)) }
  }

  return (
    <div>
      <h1>Avoirs</h1>
      <Msg text={cn.error || msg} />
      <form className="card row" onSubmit={create}>
        <select value={f.invoiceId} onChange={(e) => pick(e.target.value)} required>
          <option value="">Facture…</option>
          {invoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNumber} — {fmt(i.total)}</option>)}
        </select>
        <input type="number" min="1" max={picked?.total} placeholder="Montant" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
        <input placeholder="Motif" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} required />
        <label className="small" style={{ margin: 0 }}>
          <input type="checkbox" style={{ display: 'inline', width: 'auto', marginRight: 6 }} checked={f.restoreStock}
            onChange={(e) => setF({ ...f, restoreStock: e.target.checked })} />Remettre le stock en vente
        </label>
        <button>Émettre l’avoir</button>
      </form>
      <Loading on={cn.loading} />
      <table>
        <thead><tr><th>N°</th><th>Date</th><th>Facture</th><th>Commande</th><th>Montant</th><th>Motif</th><th>Statut</th></tr></thead>
        <tbody>{list.map((r) => (
          <tr key={r.id}>
            <td>{r.creditNoteNumber}</td>
            <td>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
            <td>{r.invoice?.invoiceNumber}</td>
            <td>{r.invoice?.order?.orderNumber}</td>
            <td>{fmt(r.amount)}</td>
            <td>{r.reason}</td>
            <td><Badge>{r.status}</Badge></td>
          </tr>
        ))}</tbody>
      </table>
      <Empty list={list} />
    </div>
  )
}
