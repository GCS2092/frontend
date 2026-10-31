import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Page en erreur :', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="card" style={{ maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
        <AlertTriangle size={28} style={{ color: 'var(--warning)' }} />
        <h2 style={{ margin: '12px 0 6px' }}>Cette page a rencontré un problème</h2>
        <p className="muted" style={{ margin: '0 0 16px' }}>Le reste de l’application fonctionne. Vous pouvez recharger la page ou revenir à une autre section.</p>
        <button type="button" onClick={() => window.location.reload()}>Recharger</button>
      </div>
    )
  }
}