import { useState } from 'react'
import api, { errMsg } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading } from '../components/ui'

export default function Settings() {
  const s = useApi('/settings')
  const [edit, setEdit] = useState({})
  const [msg, setMsg] = useState('')
  const base = s.data && typeof s.data === 'object' ? s.data : {}
  const keys = Object.keys(base).filter((k) => ['string', 'number'].includes(typeof base[k]) || base[k] === null)
  const save = async (e) => {
    e.preventDefault(); setMsg('')
    if (!Object.keys(edit).length) return setMsg('Aucune modification.')
    try { await api.put('/settings', edit); setEdit({}); setMsg('Paramètres enregistrés.'); s.reload() } catch (er) { setMsg(errMsg(er)) }
  }
  return (
    <div>
      <h1>Paramètres</h1>
      <Msg text={s.error || msg} /><Loading on={s.loading} />
      <form className="card" onSubmit={save}>
        {keys.map((k) => (
          <label key={k}>{k}
            <input value={edit[k] ?? base[k] ?? ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
          </label>
        ))}
        <button>Enregistrer</button>
      </form>
    </div>
  )
}
