import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Download, FileUp, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import api, { errMsg, rows, fmt, download } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import Modal from '../ui/Modal'
import { toast, confirmDialog } from '../ui/feedback'

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

const validMoney = (v) => Number.isFinite(Number(v)) && Number(v) >= 0
const optInt = z.string().trim().refine((v) => v === '' || /^\d+$/.test(v), 'Entier positif ou vide')
const schema = z.object({
  name: z.string().trim().min(2, 'Au moins 2 caractères'),
  price: z.string().trim().min(1, 'Prix requis').refine(validMoney, 'Montant invalide'),
  purchasePrice: z.string().trim().refine((v) => v === '' || validMoney(v), 'Montant invalide'),
  categoryId: z.string().min(1, 'Choisissez une catégorie'),
  sku: z.string().trim().max(60, '60 caractères max'),
  barcode: z.string().trim().max(60, '60 caractères max'),
  lowStockAlert: optInt,
  overstockAlert: optInt,
  description: z.string(),
  supplierId: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'OUT_OF_STOCK']),
})
const EMPTY = {
  name: '', price: '', purchasePrice: '', categoryId: '', sku: '', barcode: '',
  lowStockAlert: '', overstockAlert: '', description: '', supplierId: '', status: 'PUBLISHED',
}
const toForm = (p) => ({
  name: p.name ?? '',
  price: String(p.price ?? ''),
  purchasePrice: p.purchasePrice != null ? String(p.purchasePrice) : '',
  categoryId: String(p.categoryId ?? p.category?.id ?? ''),
  sku: p.sku ?? '',
  barcode: p.barcode ?? '',
  lowStockAlert: p.lowStockAlert != null ? String(p.lowStockAlert) : '',
  overstockAlert: p.overstockAlert != null ? String(p.overstockAlert) : '',
  description: p.description ?? '',
  supplierId: p.supplierId ?? p.supplier?.id ?? '',
  status: p.status ?? 'DRAFT',
})
const toPayload = (v) => ({
  name: v.name,
  price: Number(v.price),
  categoryId: v.categoryId,
  description: v.description.trim() || v.name,
  sku: v.sku || null,
  barcode: v.barcode || null,
  lowStockAlert: v.lowStockAlert === '' ? 5 : Number(v.lowStockAlert),
  overstockAlert: v.overstockAlert === '' ? null : Number(v.overstockAlert),
  supplierId: v.supplierId || null,
  purchasePrice: v.purchasePrice === '' ? null : Number(v.purchasePrice),
})

const STATUS = { PUBLISHED: ['Publié', 'success'], DRAFT: ['Brouillon', 'warning'], OUT_OF_STOCK: ['Rupture', 'danger'] }
const StatusPill = ({ value }) => {
  const s = STATUS[value]
  return s ? <span className={`badge ${s[1]}`}>{s[0]}</span> : <Badge>{value}</Badge>
}

const stockState = (p) => {
  const s = Number(p.stock ?? 0)
  if (s <= 0) return 'out'
  return s <= Number(p.lowStockAlert ?? 5) ? 'low' : 'ok'
}

function StockCell({ p }) {
  const s = Number(p.stock ?? 0)
  const state = stockState(p)
  const ref = Math.max(Number(p.lowStockAlert ?? 5) * 3, 1)
  const pct = Math.min(100, Math.round((s / ref) * 100))
  const color = state === 'out' ? 'var(--danger)' : state === 'low' ? 'var(--warning)' : 'var(--primary)'
  return (
    <div className="gauge">
      <div className="gauge-bar"><i style={{ width: `${pct}%`, background: color }} /></div>
      <span className={`gauge-n ${state}`}>{s}</span>
    </div>
  )
}

const EMPTY_V = { size: '', color: '', sku: '', barcode: '' }

function Variants({ product, onChanged }) {
  const [f, setF] = useState(EMPTY_V)
  const [editId, setEditId] = useState(null)
  const [busy, setBusy] = useState(false)
  const list = product.variants || []
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const clear = () => { setF(EMPTY_V); setEditId(null) }

  const save = async () => {
    if (!f.size.trim() && !f.color.trim()) return toast.error('Indiquez une taille ou une couleur.')
    setBusy(true)
    try {
      if (editId) await api.put(`/products/variants/${editId}`, f)
      else await api.post(`/products/${product.id}/variants`, f)
      toast.success(editId ? 'Variante modifiée' : 'Variante ajoutée')
      clear(); onChanged()
    } catch (er) { toast.error(errMsg(er)) }
    finally { setBusy(false) }
  }

  const edit = (v) => {
    setEditId(v.id)
    setF({ size: v.size || '', color: v.color || '', sku: v.sku || '', barcode: v.barcode || '' })
  }

  const del = async (v) => {
    const ok = await confirmDialog({
      title: `Supprimer la variante ${v.size || '—'} / ${v.color || '—'} ?`,
      message: 'Possible seulement si son stock est à zéro et si elle n’a jamais été vendue ni déplacée.',
      danger: true, confirmLabel: 'Supprimer',
    })
    if (!ok) return
    try { await api.delete(`/products/variants/${v.id}`); toast.success('Variante supprimée'); if (editId === v.id) clear(); onChanged() }
    catch (er) { toast.error(errMsg(er)) }
  }

  const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); save() } }

  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ fontSize: 14, margin: '0 0 4px' }}>Variantes</h3>
      <p className="small muted" style={{ margin: '0 0 8px' }}>
        Le stock d’une variante se saisit dans « Mouvements » (choisir le produit puis la variante).
      </p>
      {list.length > 0 && (
        <div className="table-wrap">
          <table className="dt">
            <thead><tr><th>Taille</th><th>Couleur</th><th>SKU</th><th>Code-barres</th><th className="r">Stock</th><th></th></tr></thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.id}>
                  <td>{v.size || '—'}</td><td>{v.color || '—'}</td><td>{v.sku || '—'}</td><td>{v.barcode || '—'}</td>
                  <td className="r">{v.stock}</td>
                  <td className="r">
                    <div className="row-actions">
                      <button type="button" className="ghost icon-btn" title="Modifier" aria-label="Modifier" onClick={() => edit(v)}><Pencil size={14} /></button>
                      <button type="button" className="ghost icon-btn danger-text" title="Supprimer" aria-label="Supprimer" onClick={() => del(v)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="form-grid" style={{ marginTop: 10 }}>
        <input placeholder="Taille (ex. M)" value={f.size} onChange={set('size')} onKeyDown={onKey} />
        <input placeholder="Couleur" value={f.color} onChange={set('color')} onKeyDown={onKey} />
        <input placeholder="SKU (optionnel)" value={f.sku} onChange={set('sku')} onKeyDown={onKey} />
        <input placeholder="Code-barres (optionnel)" value={f.barcode} onChange={set('barcode')} onKeyDown={onKey} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" className="ghost" disabled={busy} onClick={save}>
          <Plus size={14} /> {busy ? '…' : editId ? 'Enregistrer la variante' : 'Ajouter la variante'}
        </button>
        {editId && <button type="button" className="ghost" onClick={clear}>Annuler</button>}
      </div>
    </div>
  )
}

function StoreStocks({ product }) {
  const byStore = new Map()
  ;(product.storeStocks || []).forEach((l) => {
    const cur = byStore.get(l.storeId) || { name: l.store?.name || '-', qty: 0, res: 0 }
    cur.qty += l.quantity
    cur.res += l.reservedQuantity
    byStore.set(l.storeId, cur)
  })
  const list = [...byStore.values()]
  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ fontSize: 14, margin: '0 0 4px' }}>Stock par boutique</h3>
      <p className="small muted" style={{ margin: '0 0 8px' }}>
        La liste affiche le total toutes boutiques (variantes comprises). Le détail par boutique est ci-dessous.
      </p>
      {list.length > 0 ? (
        <div className="table-wrap">
          <table className="dt">
            <thead><tr><th>Boutique</th><th className="r">Quantité</th><th className="r">Réservé</th><th className="r">Disponible</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.name}><td>{s.name}</td><td className="r">{s.qty}</td><td className="r">{s.res}</td><td className="r">{Math.max(0, s.qty - s.res)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="small muted">Aucun stock enregistré pour ce produit.</p>}
    </div>
  )
}

export default function Products() {
  const { storeId } = useAuth()
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [sorting, setSorting] = useState([])
  const [catName, setCatName] = useState('')
  const [catBusy, setCatBusy] = useState(false)
  const [filter, setFilter] = useState('all')
  const [report, setReport] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 300)
    return () => clearTimeout(t)
  }, [input])

  const { data, error, loading, reload } = useApi('/products/admin/all', { storeId, search: search || undefined, limit: 100 })
  const cats = useApi('/categories')
  const sups = useApi('/admin/accounting/suppliers')
  const list = useMemo(() => rows(data).map((p) => (p.variants?.length
    ? { ...p, stock: p.variants.reduce((a, v) => a + Number(v.stock || 0), 0), reservedStock: p.variants.reduce((a, v) => a + Number(v.reservedStock || 0), 0) }
    : p)), [data])
  const categories = rows(cats.data)
  const suppliers = rows(sups.data)
  const counts = useMemo(() => {
    const c = { all: list.length, ok: 0, low: 0, out: 0 }
    list.forEach((p) => { c[stockState(p)] += 1 })
    return c
  }, [list])
  const shown = useMemo(() => (filter === 'all' ? list : list.filter((p) => stockState(p) === filter)), [list, filter])

  // Garde la fiche ouverte synchronisée avec la liste rechargée (variantes ajoutées / supprimées)
  useEffect(() => {
    if (!editing) return
    const fresh = list.find((p) => p.id === editing.id)
    if (fresh) setEditing(fresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list])

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema), defaultValues: EMPTY,
  })

  const openCreate = () => { setEditing(null); reset(EMPTY); setOpen(true) }
  const openEdit = (p) => { setEditing(p); reset(toForm(p)); setOpen(true) }
  const onOpenChange = (o) => { setOpen(o); if (!o) { setEditing(null); reset(EMPTY); setCatName('') } }

  const onSubmit = async (v) => {
    try {
      const body = toPayload(v)
      if (editing) {
        await api.put(`/products/${editing.id}`, { ...body, ...(v.status !== editing.status && { status: v.status }) })
        toast.success(`Produit « ${v.name} » modifié`)
        onOpenChange(false); reload()
      } else {
        const { data: created } = await api.post('/products', { ...body, slug: slugify(v.name), stock: 0, status: v.status })
        toast.success(`Produit « ${v.name} » créé. Vous pouvez ajouter ses variantes.`)
        reload()
        setEditing({ ...created, variants: created.variants || [] })
        reset(toForm(created))
      }
    } catch (er) { toast.error(errMsg(er)) }
  }

  const remove = async (p) => {
    const ok = await confirmDialog({
      title: `Supprimer « ${p.name} » ?`, message: 'Cette action est irréversible. Si le produit a déjà des commandes, le serveur peut la refuser.',
      danger: true, confirmLabel: 'Supprimer',
    })
    if (!ok) return
    try { await api.delete(`/products/${p.id}`); toast.success('Produit supprimé'); reload() }
    catch (er) { toast.error(errMsg(er)) }
  }

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

  // ─── Excel ───
  const getFile = async (url, name) => {
    try { await download(url, name) } catch (er) { toast.error(errMsg(er)) }
  }
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const ok = await confirmDialog({
      title: `Importer « ${file.name} » ?`,
      message: 'Les produits existants (même identifiant) sont mis à jour. Laissez la colonne stock à 0 : le stock se saisit dans « Mouvements » pour être rattaché à une boutique. Faites une sauvegarde avant un gros import.',
      confirmLabel: 'Importer',
    })
    if (!ok) return
    const fd = new FormData()
    fd.append('file', file)
    setImporting(true)
    try {
      const { data: r } = await api.post('/products/import', fd)
      setReport(r); reload()
    } catch (er) { toast.error(errMsg(er)) }
    finally { setImporting(false) }
  }

  const columns = useMemo(() => [
    { accessorKey: 'name', header: 'Nom' },
    { accessorKey: 'sku', header: 'SKU', cell: (i) => i.getValue() || '—', sortUndefined: 'last' },
    { accessorKey: 'price', header: 'Prix', cell: (i) => fmt(i.getValue()), meta: { right: true } },
    { accessorKey: 'purchasePrice', header: 'Achat', cell: (i) => (i.getValue() != null ? fmt(i.getValue()) : '—'), meta: { right: true }, sortUndefined: 'last' },
    {
      id: 'margin', header: 'Marge', meta: { right: true }, sortUndefined: 'last',
      accessorFn: (p) => (p.purchasePrice != null && Number(p.price) > 0 ? Math.round(((p.price - p.purchasePrice) / p.price) * 100) : undefined),
      cell: (i) => (i.getValue() == null ? '—' : `${i.getValue()} %`),
    },
    {
      accessorKey: 'stock', header: 'Stock total', meta: { right: true },
      cell: (i) => <StockCell p={i.row.original} />,
    },
    { accessorKey: 'reservedStock', header: 'Réservé', meta: { right: true } },
    { accessorKey: 'status', header: 'Statut', cell: (i) => <StatusPill value={i.getValue()} /> },
    {
      id: 'actions', header: '', enableSorting: false, meta: { right: true },
      cell: (i) => (
        <div className="row-actions">
          <button type="button" className="ghost icon-btn" title="Modifier" aria-label="Modifier" onClick={() => openEdit(i.row.original)}><Pencil size={14} /></button>
          <button type="button" className="ghost icon-btn danger-text" title="Supprimer" aria-label="Supprimer" onClick={() => remove(i.row.original)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const table = useReactTable({
    data: shown, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <div className="page-head">
        <div><h1>Produits</h1><p className="page-sub">Catalogue, prix et niveau de stock.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="ghost" onClick={() => getFile('/products/import/template', 'template-produits.xlsx')}><Download size={15} /> Modèle Excel</button>
          <button type="button" className="ghost" onClick={() => getFile('/products/export', 'catalogue-produits.xlsx')}><Download size={15} /> Exporter</button>
          <button type="button" className="ghost" disabled={importing} onClick={() => fileRef.current?.click()}><FileUp size={15} /> {importing ? 'Import…' : 'Importer'}</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={onFile} />
          <button type="button" onClick={openCreate}><Plus size={16} /> Nouveau produit</button>
        </div>
      </div>
      <Msg text={error} />

      <div className="toolbar">
        <div className="search-box">
          <Search size={15} />
          <input className="search" placeholder="Rechercher un produit…" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <div className="fchips" role="group" aria-label="Filtrer par état du stock">
          {[['all', 'Tous'], ['ok', 'En stock'], ['low', 'Stock faible'], ['out', 'Rupture']].map(([k, l]) => (
            <button key={k} type="button" className={`fchip${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>
              {l} <span className="fchip-n">{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <Loading on={loading} />
      {shown.length > 0 && (
        <div className="table-wrap">
          <table className="dt">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const s = h.column.getIsSorted()
                    const can = h.column.getCanSort()
                    return (
                      <th key={h.id} className={`${can ? 'sortable' : ''}${h.column.columnDef.meta?.right ? ' r' : ''}`} onClick={can ? h.column.getToggleSortingHandler() : undefined}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {can && (
                          <span className="sort-ind">
                            {s === 'asc' ? <ArrowUp size={12} /> : s === 'desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} style={{ opacity: .35 }} />}
                          </span>
                        )}
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
      {!loading && <Empty list={shown} />}

      <Modal open={open} onOpenChange={onOpenChange} size="lg" title={editing ? 'Modifier le produit' : 'Nouveau produit'}
        description={editing ? undefined : 'Le stock initial se saisit dans « Mouvements » (entrée), pour être rattaché à une boutique.'}
        footer={<>
          <button type="button" className="ghost" onClick={() => onOpenChange(false)}>{editing ? 'Fermer' : 'Annuler'}</button>
          <button type="submit" form="product-form" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le produit'}
          </button>
        </>}>
        <form id="product-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label>Nom
            <input className={errors.name ? 'invalid' : ''} autoFocus {...register('name')} />
            {errors.name && <div className="field-error">{errors.name.message}</div>}
          </label>
          <label>Description <span className="muted">(optionnel)</span>
            <textarea rows={3} style={{ width: '100%', display: 'block' }} {...register('description')} />
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
            <label>SKU <span className="muted">(optionnel, unique)</span>
              <input className={errors.sku ? 'invalid' : ''} {...register('sku')} />
              {errors.sku && <div className="field-error">{errors.sku.message}</div>}
            </label>
            <label>Code-barres <span className="muted">(optionnel, unique)</span>
              <input className={errors.barcode ? 'invalid' : ''} {...register('barcode')} />
              {errors.barcode && <div className="field-error">{errors.barcode.message}</div>}
            </label>
            <label>Seuil d’alerte stock bas <span className="muted">(défaut 5)</span>
              <input type="number" min="0" step="1" className={errors.lowStockAlert ? 'invalid' : ''} {...register('lowStockAlert')} />
              {errors.lowStockAlert && <div className="field-error">{errors.lowStockAlert.message}</div>}
            </label>
            <label>Seuil de surstock <span className="muted">(optionnel)</span>
              <input type="number" min="0" step="1" className={errors.overstockAlert ? 'invalid' : ''} {...register('overstockAlert')} />
              {errors.overstockAlert && <div className="field-error">{errors.overstockAlert.message}</div>}
            </label>
            <label>Fournisseur <span className="muted">(optionnel)</span>
              <select {...register('supplierId')}>
                <option value="">Aucun</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label>Statut
              <select {...register('status')}>
                <option value="PUBLISHED">Publié</option>
                <option value="DRAFT">Brouillon</option>
                <option value="OUT_OF_STOCK">Rupture (manuel)</option>
              </select>
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

        {editing
          ? <><StoreStocks product={editing} /><Variants key={editing.id} product={editing} onChanged={reload} /></>
          : <p className="small muted" style={{ marginTop: 14 }}>Les variantes (taille / couleur) s’ajoutent juste après la création du produit.</p>}
      </Modal>

      <Modal open={!!report} onOpenChange={(o) => { if (!o) setReport(null) }} size="lg" title="Résultat de l’import"
        footer={<button type="button" onClick={() => setReport(null)}>Fermer</button>}>
        {report && (
          <div>
            <p>
              <strong>{report.total}</strong> ligne(s) lues : <strong>{report.created}</strong> créée(s),{' '}
              <strong>{report.updated}</strong> mise(s) à jour, <strong>{report.skipped}</strong> ignorée(s).
            </p>
            {(report.warnings || []).map((w, i) => <p key={i} className="small muted">{w}</p>)}
            {(report.errors || []).length > 0 && (
              <div className="table-wrap" style={{ maxHeight: 280, overflow: 'auto' }}>
                <table className="dt">
                  <thead><tr><th>Ligne</th><th>Produit</th><th>Problème</th></tr></thead>
                  <tbody>
                    {report.errors.map((x, i) => (
                      <tr key={i}><td>{x.row}</td><td>{x.name}</td><td>{(x.errors || []).join(' ; ')}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
