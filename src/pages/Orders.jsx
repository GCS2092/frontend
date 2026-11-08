import { Fragment, useState } from 'react'
import api, { errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import Pager from '../components/Pager'
import { tv } from '../ui/fr'
import { toast, confirmDialog } from '../ui/feedback'

const STATUSES = ['DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const clientOf = (o) => {
  const u = o.user
  return (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '') || o.guestName || o.guestPhone || o.guestEmail || '—'
}
const dt = (v) => (v ? new Date(v).toLocaleString('fr-FR') : '')

export default function Orders() {
  const { storeId } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [todo, setTodo] = useState(false)
  const [open, setOpen] = useState('')
  const o = useApi('/admin/orders', {
    storeId, page, limit: 20,
    search: search || undefined, status: status || undefined, view: todo ? 'todo' : undefined,
  })
  const list = rows(o.data)

  const act = async (fn, ok) => {
    try { await fn(); if (ok) toast.success(ok); o.reload() } catch (e) { toast.error(errMsg(e)) }
  }
  const confirmDraft = async (r) => {
    const ok = await confirmDialog({ title: `Confirmer ${r.orderNumber} ?`, message: 'La réservation de stock sera confirmée.', confirmLabel: 'Confirmer' })
    if (ok) act(() => api.patch(`/admin/orders/${r.id}/confirm-draft`, {}), 'Commande confirmée.')
  }
  const rejectDraft = (r) => {
    const reason = window.prompt('Motif du rejet (optionnel)')
    if (reason === null) return
    act(() => api.patch(`/admin/orders/${r.id}/reject-draft`, { reason }), 'Commande rejetée, stock libéré.')
  }
  const markPaid = async (r) => {
    const ok = await confirmDialog({ title: `Marquer ${r.orderNumber} comme payée ?`, message: `Montant : ${fmt(r.total)}. Une facture sera émise.`, confirmLabel: 'Valider le paiement' })
    if (ok) act(() => api.patch(`/admin/orders/${r.id}/payment`, { paymentStatus: 'PAID' }), 'Paiement validé.')
  }
  const rejectPay = (r) => {
    const note = window.prompt('Motif du rejet du paiement')
    if (note === null) return
    act(() => api.patch(`/admin/orders/${r.id}/payment`, { paymentStatus: 'REJECTED', note }), 'Paiement rejeté.')
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Commandes</h1>
          <p className="page-sub">Suivi, confirmation et encaissement.</p>
        </div>
      </div>
      <Msg text={o.error} />
      <div className="toolbar">
        <input className="search" style={{ margin: 0 }} placeholder="N° commande, client…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{tv(s)}</option>)}
        </select>
        <button type="button" className={`ghost${todo ? ' on' : ''}`}
          onClick={() => { setTodo(!todo); setPage(1) }}>{todo ? 'À traiter (actif)' : 'À traiter'}</button>
      </div>
      <Loading on={o.loading} />
      <div className="table-wrap"><table className="dt">
        <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Boutique</th><th>Total</th><th>Statut</th><th>Paiement</th><th>Expire</th><th></th></tr></thead>
        <tbody>{list.map((r) => (
          <Fragment key={r.id}>
            <tr>
              <td>{r.orderNumber}</td>
              <td>{dt(r.createdAt)}</td>
              <td>{clientOf(r)}</td>
              <td>{r.store?.name}</td>
              <td>{fmt(r.total)}</td>
              <td><Badge>{r.status}</Badge></td>
              <td><Badge>{r.paymentStatus}</Badge></td>
              <td>{r.status === 'DRAFT' ? dt(r.reservationExpiresAt) : ''}</td>
              <td>
                <button className="link" onClick={() => setOpen(open === r.id ? '' : r.id)}>{open === r.id ? 'Masquer' : 'Détail'}</button>
                {r.status === 'DRAFT' && <>
                  <button className="link" onClick={() => confirmDraft(r)}>Confirmer</button>
                  <button className="link" onClick={() => rejectDraft(r)}>Rejeter</button>
                </>}
                {r.status !== 'DRAFT' && r.status !== 'CANCELLED' && ['PENDING', 'PARTIAL'].includes(r.paymentStatus) && <>
                  <button className="link" onClick={() => markPaid(r)}>Payée</button>
                  <button className="link" onClick={() => rejectPay(r)}>Refuser paiement</button>
                </>}
              </td>
            </tr>
            {open === r.id && (
              <tr><td colSpan={9} style={{ whiteSpace: 'normal' }}>
                <strong>Articles</strong>
                <ul>{(r.items || []).map((i) => (
                  <li key={i.id}>{i.product?.name || i.productId} × {i.quantity}{i.price != null ? ` — ${fmt(i.price)}` : ''}</li>
                ))}</ul>
                {r.notes && <p className="small">Note : {r.notes}</p>}
                {r.destination && <p className="small">Destination : {r.destination}</p>}
                {r.invoice && <p className="small">Facture : {r.invoice.invoiceNumber}</p>}
                {(r.statusHistory || []).length > 0 && <>
                  <strong>Historique</strong>
                  <ul>{r.statusHistory.map((h) => (
                    <li key={h.id} className="small">{dt(h.createdAt)} : {tv(h.fromStatus) || '—'} → {tv(h.toStatus)} {h.message || ''} {h.reason ? `(${h.reason})` : ''}</li>
                  ))}</ul>
                </>}
              </td></tr>
            )}
          </Fragment>
        ))}</tbody>
      </table></div>
      <Pager data={o.data} page={page} setPage={setPage} />
      <Empty list={list} />
    </div>
  )
}
