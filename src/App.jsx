import { AuthProvider, useAuth } from './auth/AuthContext'
import { isSupabaseConfigured } from './lib/supabaseClient'
import LoginScreen from './components/LoginScreen'
import AppShell from './components/AppShell'

function Gate() {
  const { session, loading } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <div className="login-wrap">
        <div className="card login-card">
          <h1>Setup needed</h1>
          <p className="error">
            Supabase environment variables are missing. Create <code>.env.local</code> from{' '}
            <code>.env.example</code>, then restart <code>npm run dev</code>.
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="center muted">Loading…</div>
  return session ? <AppShell /> : <LoginScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
