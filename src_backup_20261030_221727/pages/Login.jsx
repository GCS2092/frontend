import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api, { bearer, errMsg } from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, finishSession } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [temp, setTemp] = useState('')
  const [qr, setQr] = useState(null)
  const [backupCodes, setBackupCodes] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user && step === 'credentials') return <Navigate to="/admin" replace />

  const run = async (fn) => {
    setError(''); setBusy(true)
    try { await fn() } catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
  }

  const submitCredentials = (e) => {
    e.preventDefault()
    run(async () => {
      const { data } = await api.post('/auth/login', { email, password })
      if (data.requiresTwoFactorSetup) {
        const r = await api.post('/auth/2fa/setup', {}, bearer(data.setupToken))
        setTemp(data.setupToken); setQr(r.data); setStep('setup')
      } else if (data.requiresTwoFactor) {
        setTemp(data.pendingToken); setStep('verify')
      } else { finishSession(data); navigate('/admin') }
    })
  }

  const submitEnable = (e) => {
    e.preventDefault()
    run(async () => {
      const { data } = await api.post('/auth/2fa/enable', { code }, bearer(temp))
      finishSession(data); setBackupCodes(data.backupCodes || []); setStep('backup')
    })
  }

  const submitVerify = (e) => {
    e.preventDefault()
    run(async () => {
      const body = useBackup ? { backupCode: code } : { code }
      const { data } = await api.post('/auth/2fa/verify', body, bearer(temp))
      finishSession(data); navigate('/admin')
    })
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>SGB</h1>
        <p className="muted">Gestion de stock</p>
        {error && <div className="alert">{error}</div>}
        {step === 'credentials' && (
          <form onSubmit={submitCredentials}>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
            <label>Mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            <button disabled={busy}>{busy ? '...' : 'Se connecter'}</button>
          </form>
        )}
        {step === 'setup' && (
          <form onSubmit={submitEnable}>
            <p>Scannez ce QR code avec Google Authenticator ou Authy, puis saisissez le code à 6 chiffres.</p>
            {qr?.qrCodeDataUrl && <img src={qr.qrCodeDataUrl} alt="QR code 2FA" className="qr" />}
            {qr?.manualEntryKey && <p className="muted">Clé manuelle : <code>{qr.manualEntryKey}</code></p>}
            <label>Code<input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required autoFocus /></label>
            <button disabled={busy}>{busy ? '...' : 'Activer'}</button>
          </form>
        )}
        {step === 'verify' && (
          <form onSubmit={submitVerify}>
            <label>{useBackup ? 'Code de secours' : 'Code à 6 chiffres'}
              <input value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
            </label>
            <button disabled={busy}>{busy ? '...' : 'Valider'}</button>
            <button type="button" className="link" onClick={() => { setUseBackup(!useBackup); setCode('') }}>
              {useBackup ? 'Utiliser le code de l’application' : 'Utiliser un code de secours'}
            </button>
          </form>
        )}
        {step === 'backup' && (
          <div>
            <p><strong>Conservez ces codes de secours.</strong> Ils ne seront plus affichés.</p>
            <pre className="codes">{backupCodes.join('\n')}</pre>
            <button onClick={() => navigate('/admin')}>J’ai noté mes codes, continuer</button>
          </div>
        )}
      </div>
    </div>
  )
}