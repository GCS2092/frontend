import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Download, PieChart, Rows3, Search } from 'lucide-react'
import { Badge } from './ui'
import { DonutCard } from '../ui/charts'
import { colLabel, tv } from '../ui/fr'

const HIDE = /token|secret|hash|password|^id$|updatedAt/i
const STATUS = /status|statut|state|etat|état/i
const show = (v) => {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? 'oui' : 'non'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString('fr-FR')
  return String(v)
}
const text = (v) => tv(show(v))

export default function DataTable({ list, actions, max = 8, searchable = true }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 1 })
  const [chart, setChart] = useState(false)
  const [compact, setCompact] = useState(() => localStorage.getItem('density') === 'compact')

  const cols = useMemo(() => {
    if (!list.length) return []
    return Object.keys(list[0])
      .filter((k) => !HIDE.test(k) && ['string', 'number', 'boolean'].includes(typeof list[0][k]))
      .slice(0, max)
  }, [list, max])

  const rows = useMemo(() => {
    let r = list
    const needle = q.trim().toLowerCase()
    if (needle) r = r.filter((row) => cols.some((c) => text(row[c]).toLowerCase().includes(needle)))
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

  const statusCol = cols.find((c) => STATUS.test(c))
  const dist = useMemo(() => {
    if (!statusCol) return []
    const m = new Map()
    rows.forEach((r) => { const k = text(r[statusCol]) || '—'; m.set(k, (m.get(k) || 0) + 1) })
    return [...m].map(([name, value]) => ({ name, value }))
  }, [rows, statusCol])

  if (!list.length) return null

  const isNum = (c) => typeof list[0][c] === 'number'
  const toggle = (c) => setSort((s) => (s.key === c ? { key: c, dir: -s.dir } : { key: c, dir: 1 }))
  const showSearch = searchable && list.length > 8
  const toggleDensity = () => setCompact((v) => { localStorage.setItem('density', v ? 'comfy' : 'compact'); return !v })

  const exportCsv = () => {
    const esc = (v) => `"${text(v).replace(/"/g, '""')}"`
    const csv = [cols.map((c) => `"${colLabel(c).replace(/"/g, '""')}"`).join(';'), ...rows.map((r) => cols.map((c) => esc(r[c])).join(';'))].join('\r\n')
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `export-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="toolbar">
        {showSearch ? (
          <div className="search-box">
            <Search size={15} />
            <input className="search" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        ) : <span className="small muted">{rows.length} ligne{rows.length > 1 ? 's' : ''}</span>}
        <div className="row">
          {showSearch && <span className="small muted">{rows.length} / {list.length}</span>}
          <button type="button" className="ghost tool-btn" title="Densité d’affichage" onClick={toggleDensity}><Rows3 size={15} /></button>
          <button type="button" className="ghost tool-btn" title="Exporter en CSV" onClick={exportCsv}><Download size={15} /> CSV</button>
          {statusCol && (
            <button type="button" className="ghost tool-btn" onClick={() => setChart(!chart)}>
              <PieChart size={15} /> {chart ? 'Masquer' : 'Répartition'}
            </button>
          )}
        </div>
      </div>
      {chart && statusCol && (
        <div style={{ maxWidth: 560, marginBottom: 16 }}>
          <DonutCard title={`Répartition par ${colLabel(statusCol).toLowerCase()}`} data={dist} centerLabel="Lignes" format={(v) => String(v)} />
        </div>
      )}
      <div className={`table-wrap${compact ? ' compact' : ''}`}>
        <table className="dt">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c} className={`sortable${isNum(c) ? ' r' : ''}`} onClick={() => toggle(c)}>
                  {colLabel(c)}
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
                  <td key={c} className={isNum(c) ? 'r' : ''}>
                    {STATUS.test(c) && r[c] != null && r[c] !== '' ? <Badge>{show(r[c])}</Badge> : text(r[c])}
                  </td>
                ))}
                {actions && <td className="actions-cell">{actions(r)}</td>}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={cols.length + (actions ? 1 : 0)} className="muted" style={{ textAlign: 'center' }}>Aucun résultat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}