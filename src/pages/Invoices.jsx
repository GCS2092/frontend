import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { download, errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import Pager from '../components/Pager'
import { tv } from '../ui/fr'

const STATUSES = ['GENERATED', 'SENT', 'PAID', 'CANCELLED']

const amountOf = (r) => {
  const k = Object.keys(r).find((x) => /^(total|totalAmount|amount|grandTotal|totalTTC)$/i.test(x))
    ?? Object.keys(r).find((x) => /total|amount|ttc/i.test(x) && typeof r[x] === 'number')
  return k ? Number(r[k]) : null
}
const clientOf = (r) => {
  const o = r.order || {}
  const u = o.user
  return (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '') || o.guestName || o.guestEmail || '—'
}

export default function Invoices() {
  const { storeId } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [msg, setMsg] = useState('')
  const filters = { storeId, search: search || undefined, status: status || undefined }
  const inv = useApi('/admin/invoices', { ...filters, page, limit: 20 })
  const list = rows(inv.data)

  const get = async (url, name) => {
    setMsg('')
    try { await download(url, name, filters) } catch (e) { setMsg(e.response?.status === 404 ? 'Aucune facture à exporter.' : errMsg(e)) }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Factures</h1>
          <p className="page-sub">Consultation et export de la boutique sélectionnée.</p>
        </div>
      </div>
      <Msg text={inv.error || msg} />
      <div className="toolbar">
        <input className="search" style={{ margin: 0 }} placeholder="N° facture, commande, client…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{tv(s)}</option>)}
        </select>
        <button type="button" onClick={() => get('/admin/invoices/export/excel', 'factures.xlsx')}><FileSpreadsheet size={16} /> Exporter en Excel</button>
      </div>
      <Loading on={inv.loading} />
      <div className="table-wrap"><table className="dt">
        <thead><tr><th>N°</th><th>Date</th><th>Commande</th><th>Client</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
        <tbody>{list.map((r) => {
          const a = amountOf(r)
          return (
            <tr key={r.id}>
              <td>{r.invoiceNumber}</td>
              <td>{r.issuedAt ? new Date(r.issuedAt).toLocaleDateString('fr-FR') : ''}</td>
              <td>{r.order?.orderNumber}</td>
              <td>{clientOf(r)}</td>
              <td>{a != null ? fmt(a) : '—'}</td>
              <td><Badge>{r.status}</Badge></td>
              <td><button className="link" onClick={() => get(`/admin/invoices/${r.id}/pdf`, `facture-${r.invoiceNumber || r.id}.pdf`)}>PDF</button></td>
            </tr>
          )
        })}</tbody>
      </table></div>
      <Pager data={inv.data} page={page} setPage={setPage} />
      <Empty list={list} />
    </div>
  )
}
