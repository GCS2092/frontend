import { rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'

export default function Audit() {
  const a = useApi('/admin/audit', { limit: 100 })
  const list = rows(a.data)
  return (
    <div>
      <h1>Journal d’audit</h1>
      <Msg text={a.error} /><Loading on={a.loading} />
      <DataTable list={list} max={9} />
      <Empty list={list} />
    </div>
  )
}
