import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar({ currentPage = 'emprendimientos' }) {
  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        <span className={styles['logo-text']}>Alia</span>
      </Link>

      <div className={styles['nav-center']}>
        <button className={styles['search-btn']} aria-label="Buscar emprendimientos">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <Link 
          to="/emprendimientos" 
          className={`${styles['nav-link']} ${currentPage === 'emprendimientos' ? styles.active : ''}`}
        >
          Emprendimientos
        </Link>

        <Link 
          to="/crear" 
          className={`${styles['nav-link']} ${currentPage === 'crear' ? styles.active : ''}`}
        >
          Crear Emprendimiento
        </Link>

        <Link 
          to="/perfil" 
          className={`${styles['nav-link']} ${currentPage === 'perfil' ? styles.active : ''}`}
        >
          Perfil
        </Link>
      </div>
    </nav>
  )
}
