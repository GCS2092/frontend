import { useState } from 'react'
import { rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'
import Pager from '../components/Pager'

export default function Audit() {
  const { storeId } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const a = useApi('/admin/audit', { storeId, page, limit: 50, search: search || undefined })
  const list = rows(a.data)
  return (
    <div>
      <h1>Journal d’audit</h1>
      <Msg text={a.error} />
      <input className="search" placeholder="Rechercher (action, module, id)…" value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      <Loading on={a.loading} />
      <DataTable list={list} max={9} />
      <Pager data={a.data} page={page} setPage={setPage} />
      <Empty list={list} />
    </div>
  )
}
