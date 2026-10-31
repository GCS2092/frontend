import { Inbox } from 'lucide-react'

export const Msg = ({ text }) => (text ? <div className="alert" role="alert">{text}</div> : null)

export const Loading = ({ on }) => (on ? (
  <div className="skeletons" aria-busy="true" aria-label="Chargement">
    <div className="ui-skeleton" style={{ height: 18, width: '30%' }} />
    <div className="ui-skeleton" style={{ height: 14 }} />
    <div className="ui-skeleton" style={{ height: 14, width: '85%' }} />
    <div className="ui-skeleton" style={{ height: 14, width: '70%' }} />
  </div>
) : null)

export const Empty = ({ list }) => (list.length ? null : (
  <div className="empty"><Inbox size={28} /><span>Aucune donnée.</span></div>
))

const GOOD = /^(actif|active|ok|pay[ée]e?|paid|re[cç]u|received|valid[ée]e?|validated|completed|termin[ée]e?|confirm[ée]e?|oui|yes|true)$/i
const BAD = /^(annul[ée]e?|cancel+ed|rejet[ée]e?|rejected|refus[ée]e?|inactif|inactive|failed|[ée]chou[ée]e?|non|no|false)$/i
const WARN = /^(pending|en attente|draft|brouillon|partiel(le)?|partial|open|ouvert(e)?)$/i

export const Badge = ({ children }) => {
  const s = typeof children === 'string' ? children.trim() : ''
  const tone = GOOD.test(s) ? 'success' : BAD.test(s) ? 'danger' : WARN.test(s) ? 'warning' : ''
  return <span className={`badge${tone ? ' ' + tone : ''}`}>{children}</span>
}