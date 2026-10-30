export const Msg = ({ text }) => (text ? <div className="alert">{text}</div> : null)
export const Loading = ({ on }) => (on ? <p className="muted">Chargement…</p> : null)
export const Empty = ({ list }) => (list.length ? null : <p className="muted">Aucune donnée.</p>)
export const Badge = ({ children }) => <span className="badge">{children}</span>