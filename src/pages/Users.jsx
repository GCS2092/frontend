import { rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading, Empty } from '../components/ui'
import DataTable from '../components/DataTable'

export default function Users() {
  const u = useApi('/users/admin/all')
  const list = rows(u.data)
  return (
    <div>
      <h1>Utilisateurs</h1>
      <Msg text={u.error} /><Loading on={u.loading} />
      <DataTable list={list} />
      <Empty list={list} />
    </div>
  )
}
