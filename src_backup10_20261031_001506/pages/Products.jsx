import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search } from 'lucide-react'
import api, { errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import Modal from '../ui/Modal'
import { toast } from '../ui/feedback'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

const validMoney = (v) => Number.isFinite(Number(v)) && Number(v) >= 0
const schema = z.object({
  name: z.string().trim().min(2, 'Au moins 2 caractères'),
  price: z.string().trim().min(1, 'Prix requis').refine(validMoney, 'Montant invalide'),
  purchasePrice: z.string().trim().refine((v) => v === '' || validMoney(v), 'Montant invalide'),
  categoryId: z.string().min(1, 'Choisissez une catégorie'),
})
const EMPTY = { name: '', price: '', purchasePrice: '', categoryId: '' }

const STATUS = { PUBLISHED: ['Publié', 'success'], DRAFT: ['Brouillon', 'warning'], ARCHIVED: ['Archivé', ''] }
const StatusPill = ({ value }) => {
  const s = STATUS[value]
  return s ? <span className={`badge ${s[1]}`}>{s[0]}</span> : <Badge>{value}</Badge>
}

export default function Products() {
  const { storeId } = useAuth()
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [sorting, setSorting] = useState([])

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 300)
    return () => clearTimeout(t)
  }, [input])

  const { data, error, loading, reload } = useApi('/products/admin/all', { storeId, search: search || undefined, limit: 100 })
  const cats = useApi('/categories')
  const list = useMemo(() => rows(data), [data])
  const categories = rows(cats.data)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema), defaultValues: EMPTY,
  })

  const [catName, setCatName] = useState('')
  const [catBusy, setCatBusy] = useState(false)
  const addCategory = async () => {
    const name = catName.trim()
    if (name.length < 2) return toast.error('Nom de catégorie trop court')
    setCatBusy(true)
    try {
      const { data: created } = await api.post('/categories', { name, slug: slugify(name) })
      const id = created?.id ?? created?.data?.id ?? created?.category?.id
      toast.success(`Catégorie « ${name} » créée`)
      setCatName('')
      await cats.reload?.()
      if (id) setTimeout(() => setValue('categoryId', String(id), { shouldValidate: true }), 150)
    } catch (er) { toast.error(errMsg(er)) }
    finally { setCatBusy(false) }
  }
  const onOpenChange = (o) => { setOpen(o); if (!o) reset(EMPTY) }

  const onSubmit = async (v) => {
    try {
      await api.post('/products', {
        name: v.name, slug: slugify(v.name), description: v.name, price: Number(v.price), stock: 0,
        ...(v.purchasePrice && { purchasePrice: Number(v.purchasePrice) }),
        ...(v.categoryId && { categoryId: v.categoryId }), status: 'PUBLISHED',
      })
      toast.success(`Produit « ${v.name} » créé`)
      onOpenChange(false); reload()
    } catch (er) { toast.error(errMsg(er)) }
  }

  const columns = useMemo(() => [
    { accessorKey: 'name', header: 'Nom' },
    { accessorKey: 'price', header: 'Prix', cell: (i) => fmt(i.getValue()), meta: { right: true } },
    { accessorKey: 'purchasePrice', header: 'Achat', cell: (i) => (i.getValue() != null ? fmt(i.getValue()) : '—'), meta: { right: true }, sortUndefined: 'last' },
    {
      id: 'margin', header: 'Marge', meta: { right: true }, sortUndefined: 'last',
      accessorFn: (p) => (p.purchasePrice != null && Number(p.price) > 0 ? Math.round(((p.price - p.purchasePrice) / p.price) * 100) : undefined),
      cell: (i) => (i.getValue() == null ? '—' : `${i.getValue()} %`),
    },
    {
      accessorKey: 'stock', header: 'Stock', meta: { right: true },
      cell: (i) => (Number(i.getValue()) <= 0 ? <span className="badge danger">{i.getValue() ?? 0}</span> : i.getValue()),
    },
    { accessorKey: 'reservedStock', header: 'Réservé', meta: { right: true } },
    { accessorKey: 'status', header: 'Statut', cell: (i) => <StatusPill value={i.getValue()} /> },
  ], [])

  const table = useReactTable({
    data: list, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <div className="page-head">
        <h1>Produits</h1>
        <button type="button" onClick={() => setOpen(true)}><Plus size={16} /> Nouveau produit</button>
      </div>
      <Msg text={error} />

      <div className="toolbar">
        <div className="search-box">
          <Search size={15} />
          <input className="search" placeholder="Rechercher un produit…" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <span className="small muted">{list.length} produit{list.length > 1 ? 's' : ''}</span>
      </div>

      <Loading on={loading} />
      {list.length > 0 && (
        <div className="table-wrap">
          <table className="dt">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const s = h.column.getIsSorted()
                    return (
                      <th key={h.id} className={`sortable${h.column.columnDef.meta?.right ? ' r' : ''}`} onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <span className="sort-ind">
                          {s === 'asc' ? <ArrowUp size={12} /> : s === 'desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} style={{ opacity: .35 }} />}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((r) => (
                <tr key={r.id}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className={c.column.columnDef.meta?.right ? 'r' : ''}>
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && <Empty list={list} />}

      <Modal open={open} onOpenChange={onOpenChange} title="Nouveau produit"
        description="Le stock initial se saisit dans « Mouvements » (entrée), pour être rattaché à une boutique."
        footer={<>
          <button type="button" className="ghost" onClick={() => onOpenChange(false)}>Annuler</button>
          <button type="submit" form="product-form" disabled={isSubmitting}>{isSubmitting ? 'Création…' : 'Créer le produit'}</button>
        </>}>
        <form id="product-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label>Nom
            <input className={errors.name ? 'invalid' : ''} autoFocus {...register('name')} />
            {errors.name && <div className="field-error">{errors.name.message}</div>}
          </label>
          <div className="form-grid">
            <label>Prix de vente
              <input type="number" min="0" step="any" className={errors.price ? 'invalid' : ''} {...register('price')} />
              {errors.price && <div className="field-error">{errors.price.message}</div>}
            </label>
            <label>Prix d’achat <span className="muted">(optionnel)</span>
              <input type="number" min="0" step="any" className={errors.purchasePrice ? 'invalid' : ''} {...register('purchasePrice')} />
              {errors.purchasePrice && <div className="field-error">{errors.purchasePrice.message}</div>}
            </label>
          </div>
          <label>Catégorie
            <select className={errors.categoryId ? 'invalid' : ''} {...register('categoryId')}>
              <option value="">Choisir…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <div className="field-error">{errors.categoryId.message}</div>}
          </label>
          <div className="cat-add">
            <input placeholder="Nouvelle catégorie…" value={catName} onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }} />
            <button type="button" className="ghost" disabled={catBusy || !catName.trim()} onClick={addCategory}>
              <Plus size={14} /> {catBusy ? '…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}