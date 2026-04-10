import styles from './Pagination.module.css'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className={styles.pagination}>
      <button
        className={styles['btn-prev']}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        ← Anterior
      </button>

      <div className={styles['pages-container']}>
        {pages.map((page) => (
          <button
            key={page}
            className={`${styles['page-btn']} ${currentPage === page ? styles.active : ''}`}
            onClick={() => onPageChange(page)}
            aria-label={`Ir a página ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        className={styles['btn-next']}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Página siguiente"
      >
        Siguiente →
      </button>
    </div>
  )
}
