import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!email || !password) {
      setMessage('Completa correo y contraseña para continuar.')
      setIsError(true)
      return
    }

    if (password.length < 8) {
      setMessage('Tu contraseña debe tener al menos 8 caracteres.')
      setIsError(true)
      return
    }

    setMessage('')
    setIsError(false)
    // TODO: Connect to authentication API
    console.log('Login attempt:', { email, password })
    // Temporary: redirect to entrepreneurs page
    setTimeout(() => navigate('/emprendimientos'), 500)
  }

  return (
    <main className={styles.layout}>
      <section className={styles.ambient} aria-hidden="true">
        <div className={styles['shape shape-a']}></div>
        <div className={styles['shape shape-b']}></div>
        <div className={styles['shape shape-c']}></div>
      </section>

      <section className={styles['login-card']} aria-label="Formulario de inicio de sesión">
        <div className={styles['brand-wrap']}>
          <h1 className={styles.brand}>Alia</h1>
        </div>

        <header className={styles['card-header']}>
          <h2>Empieza Gratis</h2>
          <p>Vende, organiza precios y factura tu taller en un solo lugar.</p>
        </header>

        <form onSubmit={handleSubmit} className={styles['login-form']} noValidate>
          <label className={styles['field-label']} htmlFor="email">
            Correo
          </label>
          <div className={styles['input-shell']}>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" role="img" aria-label="">
                <path
                  d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="m5 8 6.24 5.2a1.2 1.2 0 0 0 1.52 0L19 8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="correo@tunegocio.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className={styles['field-label']} htmlFor="password">
            Contraseña
          </label>
          <div className={styles['input-shell']}>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" role="img" aria-label="">
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2.2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M8.5 10V7.7a3.5 3.5 0 1 1 7 0V10"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="15" r="1.4" fill="currentColor" />
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Escribe tu contraseña"
              autoComplete="current-password"
              required
              minLength="8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className={styles['toggle-password']}
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword(!showPassword)}
              data-visible={showPassword}
            >
              <svg className={`${styles.eye} ${styles['eye-open']}`} viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6-10-6-10-6Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <svg className={`${styles.eye} ${styles['eye-closed']}`} viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 4.5 21 19.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M10.5 6.2A11.9 11.9 0 0 1 12 6c6.3 0 10 6 10 6a16.2 16.2 0 0 1-3.3 3.8M7.3 8.2A16 16 0 0 0 2 12s3.7 6 10 6c1 0 2-.2 2.8-.4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <button className={styles['submit-btn']} type="submit">
            Regístrame
          </button>

          {message && (
            <p className={`${styles.message} ${isError ? styles.error : ''}`} role="status" aria-live="polite">
              {message}
            </p>
          )}
        </form>

        <footer className={styles['card-footer']}></footer>
      </section>
    </main>
  )
}
