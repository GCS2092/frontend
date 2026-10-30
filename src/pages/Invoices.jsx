import { useState } from 'react'
import { download, errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'

export default function Invoices() {
  const { storeId } = useAuth()
  const inv = useApi('/admin/invoices', { storeId })
  const [msg, setMsg] = useState('')
  const list = rows(inv.data)
  const get = async (url, name) => { setMsg(''); try { await download(url, name, { storeId }) } catch (e) { setMsg(errMsg(e)) } }
  return (
    <div>
      <h1>Factures</h1>
      <Msg text={inv.error || msg} />
      <div className="row" style={{ marginBottom: 12 }}>
        <button onClick={() => get('/admin/invoices/export/excel', 'factures.xlsx')}>Exporter en Excel</button>
      </div>
      <Loading on={inv.loading} />
      <DataTable list={list} actions={(r) => <button className="link" onClick={() => get(`/admin/invoices/${r.id}/pdf`, `facture-${r.invoiceNumber || r.number || r.id}.pdf`)}>PDF</button>} />
      <Empty list={list} />
    </div>
  )
}
