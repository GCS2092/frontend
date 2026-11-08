import { useEffect, useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import api, { errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty } from '../components/ui'
import { toast, confirmDialog } from '../ui/feedback'

const keyOf = (i) => `${i.productId}|${i.variantId || ''}`

function ReplenishmentInner() {
  const { stores, storeId } = useAuth()
  const data = useApi('/admin/replenishment', { storeId })
  const sup = useApi('/admin/accounting/suppliers')
  const items = useMemo(() => data.data?.items || [], [data.data])
  const suppliers = rows(sup.data)
  const [edit, setEdit] = useState({})
  const [busy, setBusy] = useState(false)
  const storeName = stores.find((s) => String(s.id) === String(storeId))?.name

  const get = (i) => ({
    on: i.suggested > 0 && !!i.supplierId,
    qty: String(i.suggested),
    cost: String(i.unitCost ?? 0),
    supplierId: i.supplierId || '',
    ...edit[keyOf(i)],
  })
  const patch = (i, p) => setEdit((e) => ({ ...e, [keyOf(i)]: { ...get(i), ...p } }))

  const selected = items.map((i) => ({ i, g: get(i) })).filter((x) => x.g.on)
  const total = selected.reduce((a, { g }) => a + (Number(g.qty) || 0) * (Number(g.cost) || 0), 0)
  const nSup = new Set(selected.map(({ g }) => g.supplierId).filter(Boolean)).size

  const submit = async () => {
    const lines = []
    for (const { i, g } of selected) {
      const label = i.name + (i.variantLabel ? ` (${i.variantLabel})` : '')
      const q = Number(g.qty), c = Number(g.cost)
      if (!g.supplierId) return toast.error(`${label} : choisissez un fournisseur.`)
      if (!Number.isInteger(q) || q < 1) return toast.error(`${label} : quantité entière positive requise.`)
      if (!Number.isInteger(c) || c < 0) return toast.error(`${label} : coût unitaire entier requis.`)
      lines.push({ productId: i.productId, variantId: i.variantId || undefined, quantity: q, unitCost: c, supplierId: g.supplierId })
    }
    if (!lines.length) return toast.error('Cochez au moins un article.')
    const ok = await confirmDialog({ title: `Créer ${nSup} bon(s) de commande ?`, message: `${lines.length} ligne(s), total estimé ${fmt(total)}. Les bons sont créés en brouillon : vous les envoyez ensuite depuis « Bons de commande ».`, confirmLabel: 'Créer' })
    if (!ok) return
    setBusy(true)
    try {
      const { data: r } = await api.post('/admin/replenishment/create-orders', { storeId, lines })
      toast.success(`${r.orders.length} bon(s) créé(s) : ${r.orders.map((o) => o.poNumber).join(', ')}`)
      setEdit({}); data.reload()
    } catch (er) { toast.error(errMsg(er)); data.reload() } finally { setBusy(false) }
  }

  const scan = async () => {
    try {
      const { data: r } = await api.post('/admin/replenishment/scan')
      toast.success(`Analyse terminée : ${r.notified} nouvelle(s) notification(s).`)
    } catch (er) { toast.error(errMsg(er)) }
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>Réapprovisionnement</h1><p className="page-sub">Articles sous leur seuil d’alerte à {storeName || 'la boutique sélectionnée'}. Quantité proposée : 3 × le seuil, moins le stock disponible et ce qui est déjà commandé.</p></div>
        <button type="button" className="ghost" onClick={scan}>Envoyer les alertes maintenant</button>
      </div>
      <Msg text={data.error} />
      <Loading on={data.loading} />
      {items.length > 0 && (
        <div className="table-wrap"><table className="dt">
          <thead><tr><th></th><th>Article</th><th className="r">Dispo</th><th className="r">Seuil</th><th className="r">Déjà commandé</th><th className="r">À commander</th><th className="r">Coût unitaire</th><th>Fournisseur</th></tr></thead>
          <tbody>{items.map((i) => {
            const g = get(i)
            return (
              <tr key={keyOf(i)}>
                <td><input type="checkbox" checked={g.on} onChange={(e) => patch(i, { on: e.target.checked })} aria-label="Sélectionner" /></td>
                <td>{i.name}{i.variantLabel ? ` — ${i.variantLabel}` : ''}{i.sku ? <span className="small muted"> · {i.sku}</span> : null}</td>
                <td className="r" style={{ color: i.available <= 0 ? 'var(--danger)' : undefined }}>{i.available <= 0 ? 'Rupture' : i.available}</td>
                <td className="r">{i.threshold}</td>
                <td className="r">{i.incoming || '—'}</td>
                <td className="r"><input type="number" min="1" step="1" style={{ width: 80 }} value={g.qty} onChange={(e) => patch(i, { qty: e.target.value })} /></td>
                <td className="r"><input type="number" min="0" step="1" style={{ width: 100 }} value={g.cost} onChange={(e) => patch(i, { cost: e.target.value })} /></td>
                <td>
                  <select value={g.supplierId} onChange={(e) => patch(i, { supplierId: e.target.value })}>
                    <option value="">Choisir…</option>
                    {suppliers.filter((s) => s.isActive !== false || s.id === g.supplierId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
              </tr>
            )
          })}</tbody>
        </table></div>
      )}
      {!data.loading && !items.length && <div className="empty">Aucun article sous son seuil dans cette boutique.</div>}
      {items.length > 0 && (
        <div className="row" style={{ marginTop: 12, justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span className="small muted">{selected.length} sélectionné(s) · {nSup} fournisseur(s) · total estimé {fmt(total)}</span>
          <button type="button" disabled={busy || !selected.length} onClick={submit}><ClipboardList size={15} /> {busy ? 'Création…' : 'Créer les bons de commande'}</button>
        </div>
      )}
      {!data.loading && <Empty list={items.length ? items : [1]} />}
    </div>
  )
}

export default function Replenishment() {
  const { storeId, stores, setStoreId } = useAuth()
  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.replace('#', ''))
    if (h && h !== String(storeId) && stores.some((s) => String(s.id) === h)) setStoreId(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <ReplenishmentInner key={storeId} />
}