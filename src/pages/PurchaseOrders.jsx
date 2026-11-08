import { useState } from 'react'
import { Eye, Plus, Printer, Trash2 } from 'lucide-react'
import api, { errMsg, rows, fmt } from '../api/axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Msg, Loading, Empty, Badge } from '../components/ui'
import Modal from '../ui/Modal'
import { toast, confirmDialog } from '../ui/feedback'

const vLabel = (v) => [v.size, v.color].filter(Boolean).join(' / ') || 'Variante'
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const EMPTY_LINE = { productId: '', variantId: '', quantity: '', unitCost: '' }
const day = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')

function printPo(po) {
  const w = window.open('', '_blank')
  if (!w) return toast.error('Autorisez les fenêtres pop-up pour imprimer.')
  const total = po.items.reduce((a, i) => a + i.quantityOrdered * i.unitCost, 0)
  const body = po.items.map((i) => `<tr><td>${esc(i.product?.name)}${i.variant ? ' — ' + esc(vLabel(i.variant)) : ''}</td><td class="r">${i.quantityOrdered}</td><td class="r">${i.quantityReceived}</td><td class="r">${fmt(i.unitCost)}</td><td class="r">${fmt(i.quantityOrdered * i.unitCost)}</td></tr>`).join('')
  w.document.write(`<html><head><title>${esc(po.poNumber)}</title><style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #999;padding:6px 8px;font-size:13px;text-align:left}.r{text-align:right}h1{font-size:20px;margin:0 0 6px}</style></head><body><h1>Bon de commande ${esc(po.poNumber)}</h1><div>Fournisseur : ${esc(po.supplier?.name)} ${esc(po.supplier?.phone || '')}</div><div>Boutique : ${esc(po.store?.name)}</div><div>Livraison prévue : ${day(po.expectedAt)}</div>${po.notes ? '<div>Notes : ' + esc(po.notes) + '</div>' : ''}<table><thead><tr><th>Produit</th><th class="r">Commandé</th><th class="r">Reçu</th><th class="r">Coût unitaire</th><th class="r">Total</th></tr></thead><tbody>${body}</tbody></table><p class="r"><strong>Total : ${fmt(total)}</strong></p></body></html>`)
  w.document.close(); w.focus(); w.print()
}

export default function PurchaseOrders() {
  const { storeId } = useAuth()
  const po = useApi('/admin/purchase-orders', { storeId })
  const sup = useApi('/admin/accounting/suppliers')
  const prods = useApi('/products/admin/all', { limit: 200 })
  const list = rows(po.data)
  const prodList = rows(prods.data)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const [open, setOpen] = useState(false)
  const [head, setHead] = useState({ supplierId: '', expectedAt: '', notes: '' })
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])

  const [detail, setDetail] = useState(null)
  const [recv, setRecv] = useState({})

  const act = async (fn, ok) => { setMsg(''); try { await fn(); if (ok) toast.success(ok); po.reload() } catch (er) { setMsg(errMsg(er)) } }

  const setLine = (i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)))
  const pickProduct = (i, id) => {
    const p = prodList.find((x) => x.id === id)
    setLine(i, { productId: id, variantId: '', unitCost: p?.purchasePrice != null ? String(p.purchasePrice) : lines[i].unitCost })
  }
  const openCreate = () => { setHead({ supplierId: '', expectedAt: '', notes: '' }); setLines([{ ...EMPTY_LINE }]); setOpen(true) }
  const totalNew = lines.reduce((a, l) => a + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0)

  const create = async (e) => {
    e.preventDefault()
    if (!head.supplierId) return toast.error('Choisissez un fournisseur.')
    const items = []
    for (const [i, l] of lines.entries()) {
      const p = prodList.find((x) => x.id === l.productId)
      const q = Number(l.quantity), c = Number(l.unitCost)
      if (!p) return toast.error(`Ligne ${i + 1} : choisissez un produit.`)
      if (p.variants?.length && !l.variantId) return toast.error(`Ligne ${i + 1} : choisissez la variante.`)
      if (!Number.isInteger(q) || q < 1) return toast.error(`Ligne ${i + 1} : quantité entière positive requise.`)
      if (!Number.isInteger(c) || c < 0) return toast.error(`Ligne ${i + 1} : coût unitaire entier requis.`)
      items.push({ productId: l.productId, ...(l.variantId && { variantId: l.variantId }), quantity: q, unitCost: c })
    }
    setBusy(true)
    try {
      await api.post('/admin/purchase-orders', {
        storeId, supplierId: head.supplierId, items,
        ...(head.expectedAt && { expectedAt: head.expectedAt }), ...(head.notes.trim() && { notes: head.notes.trim() }),
      })
      toast.success('Brouillon créé.'); setOpen(false); po.reload()
    } catch (er) { toast.error(errMsg(er)) } finally { setBusy(false) }
  }

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/admin/purchase-orders/${id}`)
      setDetail(data)
      setRecv(Object.fromEntries(data.items.map((i) => [i.id, String(Math.max(0, i.quantityOrdered - i.quantityReceived))])))
    } catch (er) { toast.error(errMsg(er)) }
  }
  const receivable = detail && ['ORDERED', 'PARTIAL'].includes(detail.status)
  const submitReceive = async () => {
    const out = []
    for (const i of detail.items) {
      const q = Number(recv[i.id] || 0), rest = i.quantityOrdered - i.quantityReceived
      if (!Number.isInteger(q) || q < 0) return toast.error('Quantités reçues invalides.')
      if (q > rest) return toast.error(`${i.product?.name} : reste ${rest} seulement.`)
      if (q > 0) out.push({ itemId: i.id, quantity: q })
    }
    if (!out.length) return toast.error('Saisissez au moins une quantité reçue.')
    setBusy(true)
    try {
      await api.post(`/admin/purchase-orders/${detail.id}/receive`, { lines: out })
      toast.success('Réception enregistrée, stock mis à jour.'); setDetail(null); po.reload(); prods.reload()
    } catch (er) { toast.error(errMsg(er)) } finally { setBusy(false) }
  }

  const receiveAll = (id) => act(async () => {
    const { data } = await api.get(`/admin/purchase-orders/${id}`)
    const l = data.items.filter((i) => i.quantityOrdered > i.quantityReceived).map((i) => ({ itemId: i.id, quantity: i.quantityOrdered - i.quantityReceived }))
    if (l.length) { await api.post(`/admin/purchase-orders/${id}/receive`, { lines: l }); toast.success('Réception enregistrée, stock mis à jour.') }
    else toast.error('Rien à réceptionner.')
  })

  return (
    <div>
      <div className="page-head">
        <div><h1>Bons de commande</h1><p className="page-sub">Commandez plusieurs articles chez un fournisseur, puis réceptionnez ligne par ligne.</p></div>
        <button type="button" onClick={openCreate}><Plus size={16} /> Nouveau bon</button>
      </div>
      <Msg text={po.error || msg} />
      <Loading on={po.loading} />
      <div className="table-wrap"><table className="dt">
        <thead><tr><th>N°</th><th>Fournisseur</th><th className="r">Lignes</th><th>Livraison prévue</th><th>Statut</th><th></th></tr></thead>
        <tbody>{list.map((x) => (
          <tr key={x.id}><td>{x.poNumber}</td><td>{x.supplier?.name}</td><td className="r">{x._count?.items}</td><td>{day(x.expectedAt)}</td><td><Badge>{x.status}</Badge></td>
            <td>
              <button className="link" onClick={() => openDetail(x.id)}><Eye size={13} /> Détail</button>{' '}
              {x.status === 'DRAFT' && <button className="link" onClick={() => act(() => api.patch(`/admin/purchase-orders/${x.id}/send`, {}), 'Bon envoyé au fournisseur.')}>Envoyer</button>}{' '}
              {['ORDERED', 'PARTIAL'].includes(x.status) && <button className="link" onClick={() => receiveAll(x.id)}>Tout recevoir</button>}{' '}
              {['DRAFT', 'ORDERED'].includes(x.status) && <button className="link" onClick={async () => {
                const ok = await confirmDialog({ title: 'Annuler ce bon ?', message: 'Le bon ne pourra plus être réceptionné.', danger: true, confirmLabel: 'Annuler le bon' })
                if (ok) act(() => api.patch(`/admin/purchase-orders/${x.id}/cancel`, {}), 'Bon annulé.')
              }}>Annuler</button>}
            </td></tr>
        ))}</tbody>
      </table></div>
      {!po.loading && <Empty list={list} />}

      <Modal open={open} onOpenChange={setOpen} size="lg" title="Nouveau bon de commande"
        footer={<>
          <button type="button" className="ghost" onClick={() => setOpen(false)}>Annuler</button>
          <button type="submit" form="po-form" disabled={busy}>{busy ? 'Création…' : 'Créer le brouillon'}</button>
        </>}>
        <form id="po-form" onSubmit={create}>
          <div className="form-grid">
            <label>Fournisseur
              <select value={head.supplierId} onChange={(e) => setHead({ ...head, supplierId: e.target.value })} required>
                <option value="">Choisir…</option>
                {rows(sup.data).filter((s) => s.isActive !== false).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label>Livraison prévue <span className="muted">(optionnel)</span>
              <input type="date" value={head.expectedAt} onChange={(e) => setHead({ ...head, expectedAt: e.target.value })} />
            </label>
          </div>
          <label>Notes <span className="muted">(optionnel)</span>
            <input value={head.notes} onChange={(e) => setHead({ ...head, notes: e.target.value })} />
          </label>
          <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>Lignes</h3>
          {lines.map((l, i) => {
            const p = prodList.find((x) => x.id === l.productId)
            return (
              <div key={i} className="row" style={{ gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                <select value={l.productId} onChange={(e) => pickProduct(i, e.target.value)} style={{ minWidth: 160 }}>
                  <option value="">Produit…</option>
                  {prodList.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                {p?.variants?.length > 0 && (
                  <select value={l.variantId} onChange={(e) => setLine(i, { variantId: e.target.value })}>
                    <option value="">Variante…</option>
                    {p.variants.map((v) => <option key={v.id} value={v.id}>{vLabel(v)}</option>)}
                  </select>
                )}
                <input type="number" min="1" step="1" placeholder="Qté" style={{ width: 80 }} value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
                <input type="number" min="0" step="1" placeholder="Coût unitaire" style={{ width: 120 }} value={l.unitCost} onChange={(e) => setLine(i, { unitCost: e.target.value })} />
                <span className="small muted" style={{ minWidth: 80 }}>{fmt((Number(l.quantity) || 0) * (Number(l.unitCost) || 0))}</span>
                <button type="button" className="ghost icon-btn" aria-label="Retirer la ligne" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}><Trash2 size={14} /></button>
              </div>
            )
          })}
          <button type="button" className="ghost" onClick={() => setLines((ls) => [...ls, { ...EMPTY_LINE }])}><Plus size={14} /> Ajouter une ligne</button>
          <p style={{ textAlign: 'right', marginTop: 10 }}><strong>Total : {fmt(totalNew)}</strong></p>
        </form>
      </Modal>

      <Modal open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }} size="lg"
        title={detail ? `${detail.poNumber} — ${detail.supplier?.name || ''}` : ''}
        description={detail ? `Boutique : ${detail.store?.name || ''} · Livraison prévue : ${day(detail.expectedAt)}${detail.notes ? ' · ' + detail.notes : ''}` : undefined}
        footer={detail && <>
          <button type="button" className="ghost" onClick={() => printPo(detail)}><Printer size={14} /> Imprimer</button>
          <button type="button" className="ghost" onClick={() => setDetail(null)}>Fermer</button>
          {receivable && <button type="button" disabled={busy} onClick={submitReceive}>{busy ? 'Enregistrement…' : 'Enregistrer la réception'}</button>}
        </>}>
        {detail && (
          <div className="table-wrap">
            <table className="dt">
              <thead><tr><th>Produit</th><th className="r">Commandé</th><th className="r">Déjà reçu</th><th className="r">Reste</th><th className="r">Coût</th>{receivable && <th className="r">Reçu maintenant</th>}</tr></thead>
              <tbody>
                {detail.items.map((i) => {
                  const rest = i.quantityOrdered - i.quantityReceived
                  return (
                    <tr key={i.id}>
                      <td>{i.product?.name}{i.variant ? ` — ${vLabel(i.variant)}` : ''}</td>
                      <td className="r">{i.quantityOrdered}</td><td className="r">{i.quantityReceived}</td>
                      <td className="r">{rest}</td><td className="r">{fmt(i.unitCost)}</td>
                      {receivable && <td className="r"><input type="number" min="0" max={rest} step="1" style={{ width: 80 }} disabled={rest === 0}
                        value={recv[i.id] ?? ''} onChange={(e) => setRecv({ ...recv, [i.id]: e.target.value })} /></td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}