import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pager({ data, page, setPage }) {
  const m = data?.pagination ?? data ?? {}
  const total = m.total ?? 0
  const limit = m.limit ?? 20
  const pages = m.totalPages ?? m.pages ?? Math.max(1, Math.ceil(total / limit))
  if (pages <= 1) return null
  return (
    <div className="row" style={{ margin: '8px 0 16px', justifyContent: 'center' }}>
      <button className="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /> Précédent</button>
      <span className="small muted">Page {page} / {pages} · {total} résultats</span>
      <button className="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Suivant <ChevronRight size={16} /></button>
    </div>
  )
}