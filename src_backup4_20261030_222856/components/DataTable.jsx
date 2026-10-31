import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { Badge } from './ui'

const HIDE = /token|secret|hash|password|^id$|updatedAt/i
const STATUS = /status|statut|state|etat|état/i
const show = (v) => {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? 'oui' : 'non'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString('fr-FR')
  return String(v)
}
const pretty = (k) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())

export default function DataTable({ list, actions, max = 8, searchable = true }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 1 })

  const cols = useMemo(() => {
    if (!list.length) return []
    return Object.keys(list[0])
      .filter((k) => !HIDE.test(k) && ['string', 'number', 'boolean'].includes(typeof list[0][k]))
      .slice(0, max)
  }, [list, max])

  const rows = useMemo(() => {
    let r = list
    const needle = q.trim().toLowerCase()
    if (needle) r = r.filter((row) => cols.some((c) => show(row[c]).toLowerCase().includes(needle)))
    if (sort.key) {
      r = [...r].sort((a, b) => {
        const x = a[sort.key], y = b[sort.key]
        if (x == null) return 1
        if (y == null) return -1
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir
        return String(x).localeCompare(String(y), 'fr', { numeric: true }) * sort.dir
      })
    }
    return r
  }, [list, cols, q, sort])

  if (!list.length) return null

  const toggle = (c) => setSort((s) => (s.key === c ? { key: c, dir: -s.dir } : { key: c, dir: 1 }))
  const showSearch = searchable && list.length > 8

  return (
    <div>
      {showSearch && (
        <div className="toolbar">
          <div className="search-box">
            <Search size={15} />
            <input className="search" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="small muted">{rows.length} / {list.length}</span>
        </div>
      )}
      <div className="table-wrap">
        <table className="dt">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c} className="sortable" onClick={() => toggle(c)}>
                  {pretty(c)}
                  {sort.key === c && <span className="sort-ind">{sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}</span>}
                </th>
              ))}
              {actions && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i}>
                {cols.map((c) => (
                  <td key={c}>{STATUS.test(c) && r[c] != null && r[c] !== '' ? <Badge>{show(r[c])}</Badge> : show(r[c])}</td>
                ))}
                {actions && <td>{actions(r)}</td>}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={cols.length + (actions ? 1 : 0)} className="muted" style={{ textAlign: 'center' }}>Aucun résultat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}