const HIDE = /token|secret|hash|password|^id$|updatedAt/i
const show = (v) => {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? 'oui' : 'non'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString('fr-FR')
  return String(v)
}

export default function DataTable({ list, actions, max = 8 }) {
  if (!list.length) return null
  const cols = Object.keys(list[0])
    .filter((k) => !HIDE.test(k) && ['string', 'number', 'boolean'].includes(typeof list[0][k]))
    .slice(0, max)
  return (
    <table>
      <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}{actions && <th></th>}</tr></thead>
      <tbody>{list.map((r, i) => (
        <tr key={r.id || i}>{cols.map((c) => <td key={c}>{show(r[c])}</td>)}{actions && <td>{actions(r)}</td>}</tr>
      ))}</tbody>
    </table>
  )
}
