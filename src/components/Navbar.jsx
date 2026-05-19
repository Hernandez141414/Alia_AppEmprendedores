import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar({ currentPage = 'emprendimientos' }) {
  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        <span className={styles['logo-text']}>Alia</span>
      </Link>

      <div className={styles['nav-center']}>
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
