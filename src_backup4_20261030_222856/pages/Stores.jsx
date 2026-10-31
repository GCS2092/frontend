import { useState } from 'react'
import api, { errMsg, rows } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { Msg, Loading, Empty, Badge } from '../components/ui'

const EMPTY = { code: '', name: '', address: '', phone: '', taxRate: '0', discountRate: '0', currency: 'XOF', exchangeRate: '1', isMain: false }

export default function Stores() {
  const st = useApi('/admin/stores')
  const [f, setF] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const list = rows(st.data)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const act = async (fn, ok) => { setMsg(''); try { await fn(); if (ok) setMsg(ok); st.reload() } catch (e) { setMsg(errMsg(e)) } }
  const create = (e) => {
    e.preventDefault()
    act(async () => {
      await api.post('/admin/stores', {
        code: f.code, name: f.name, address: f.address, phone: f.phone,
        taxRate: Number(f.taxRate), discountRate: Number(f.discountRate),
        currency: f.currency, exchangeRate: Number(f.exchangeRate), isMain: f.isMain,
      })
      setF(EMPTY)
    }, 'Boutique créée.')
  }
  const setMain = (r) => window.confirm(`Définir ${r.name} comme boutique principale ?`) &&
    act(() => api.patch(`/admin/stores/${r.id}`, { isMain: true }), 'Boutique principale modifiée.')
  const toggle = (r) => act(() => api.patch(`/admin/stores/${r.id}`, { isActive: !r.isActive }))

  return (
    <div>
      <h1>Boutiques</h1>
      <Msg text={st.error || msg} />
      <form className="card row" onSubmit={create}>
        <input placeholder="Code (ex : DKR)" maxLength={6} value={f.code} onChange={set('code')} required />
        <input placeholder="Nom" value={f.name} onChange={set('name')} required />
        <input placeholder="Adresse" value={f.address} onChange={set('address')} />
        <input placeholder="Téléphone" value={f.phone} onChange={set('phone')} />
        <input type="number" step="any" min="0" placeholder="TVA %" value={f.taxRate} onChange={set('taxRate')} />
        <input type="number" step="any" min="0" placeholder="Remise %" value={f.discountRate} onChange={set('discountRate')} />
        <input placeholder="Devise" maxLength={4} value={f.currency} onChange={set('currency')} />
        <input type="number" step="any" min="0" placeholder="Taux de change" value={f.exchangeRate} onChange={set('exchangeRate')} />
        <label className="small" style={{ margin: 0 }}>
          <input type="checkbox" style={{ display: 'inline', width: 'auto', marginRight: 6 }} checked={f.isMain}
            onChange={(e) => setF({ ...f, isMain: e.target.checked })} />Principale
        </label>
        <button>Créer la boutique</button>
      </form>
      <Loading on={st.loading} />
      <table>
        <thead><tr><th>Code</th><th>Nom</th><th>Téléphone</th><th>TVA %</th><th>Devise</th><th>Statut</th><th></th></tr></thead>
        <tbody>{list.map((r) => (
          <tr key={r.id}>
            <td>{r.code}</td><td>{r.name} {r.isMain && <Badge>principale</Badge>}</td>
            <td>{r.phone}</td><td>{r.taxRate}</td><td>{r.currency}</td>
            <td><Badge>{r.isActive === false ? 'inactive' : 'active'}</Badge></td>
            <td>
              {!r.isMain && <button className="link" onClick={() => setMain(r)}>Définir principale</button>}
              <button className="link" onClick={() => toggle(r)}>{r.isActive === false ? 'Activer' : 'Désactiver'}</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      <Empty list={list} />
    </div>
  )
}
