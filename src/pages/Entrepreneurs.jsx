import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import Pagination from '../components/Pagination'
import entrepreneurs from '../data/entrepreneurs.json'
import styles from './Entrepreneurs.module.css'

const ITEMS_PER_PAGE = 12 // 3 rows × 4 columns

export default function Entrepreneurs() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(entrepreneurs.length / ITEMS_PER_PAGE)

  // Get items for current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = entrepreneurs.slice(startIndex, endIndex)

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className={styles.page}>
      <Navbar currentPage="emprendimientos" />

      <main className={styles['main-content']}>
        <div className={styles.header}>
          <h1>Emprende con Nosotros</h1>
          <p>Descubre y conecta con emprendedores de nuestra comunidad</p>
        </div>

        <div className={styles['grid-container']}>
          <div className={styles.grid}>
            {currentItems.map((entrepreneur) => (
              <Card
                key={entrepreneur.id}
                nombre={entrepreneur.nombre}
                descripcion={entrepreneur.descripcion}
                preview={entrepreneur.preview}
                enlace={entrepreneur.enlace}
              />
            ))}
          </div>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  )
}
