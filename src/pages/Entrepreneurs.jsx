import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import Pagination from '../components/Pagination'
import entrepreneurs from '../data/entrepreneurs.json'
import styles from './Entrepreneurs.module.css'

const ITEMS_PER_PAGE = 12 // 3 rows × 4 columns
const CREATED_ENTREPRENEURS_KEY = 'alia_created_entrepreneurs'
const DEFAULT_WHATSAPP_NUMBER = sanitizePhone(import.meta.env.VITE_DEFAULT_WHATSAPP || '')

export default function Entrepreneurs() {
  const [currentPage, setCurrentPage] = useState(1)
  const [createdItems, setCreatedItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [modalStatus, setModalStatus] = useState('')

  useEffect(() => {
    setCreatedItems(readCreatedEntrepreneurs())
  }, [])

  const allEntrepreneurs = [...createdItems, ...entrepreneurs].map(normalizeProduct)
  const totalPages = Math.ceil(allEntrepreneurs.length / ITEMS_PER_PAGE)

  // Get items for current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = allEntrepreneurs.slice(startIndex, endIndex)

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  useEffect(() => {
    if (!selectedItem) return undefined

    const handleEscClose = (event) => {
      if (event.key === 'Escape') {
        setSelectedItem(null)
        setModalStatus('')
      }
    }

    window.addEventListener('keydown', handleEscClose)
    return () => window.removeEventListener('keydown', handleEscClose)
  }, [selectedItem])

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleViewMore = (item) => {
    setSelectedItem(item)
    setModalStatus('')
  }

  const handleBuy = async () => {
    if (!selectedItem) return

    try {
      setIsGeneratingPdf(true)
      setModalStatus('Generando PDF de tu compra...')
      const { generatePurchasePdf } = await import('../services/purchasePdf')
      await generatePurchasePdf(selectedItem)
      setModalStatus('PDF generado con éxito.')
    } catch (_error) {
      setModalStatus('No se pudo generar el PDF. Intenta de nuevo.')
    } finally {
      setIsGeneratingPdf(false)
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
                onViewMore={() => handleViewMore(entrepreneur)}
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

      {selectedItem && (
        <div
          className={styles.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedItem(null)
              setModalStatus('')
            }
          }}
        >
          <div className={styles.modal}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => {
                setSelectedItem(null)
                setModalStatus('')
              }}
              aria-label="Cerrar modal"
            >
              ×
            </button>

            <img
              src={selectedItem.preview}
              alt={`Imagen de ${selectedItem.nombre}`}
              className={styles.modalImage}
            />

            <h3 className={styles.modalTitle}>{selectedItem.nombre}</h3>
            {selectedItem.priceLabel && (
              <p className={styles.modalPrice}>Precio: {selectedItem.priceLabel}</p>
            )}
            <p className={styles.modalDescription}>{selectedItem.descripcion}</p>

            <div className={styles.actionGroup}>
              {selectedItem.whatsappUrl ? (
                <a
                  href={selectedItem.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactButton}
                >
                  Comunícate
                </a>
              ) : (
                <button
                  type="button"
                  className={`${styles.contactButton} ${styles.contactButtonDisabled}`}
                  disabled
                >
                  Comunícate
                </button>
              )}

              <button
                type="button"
                className={styles.buyButton}
                onClick={handleBuy}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? 'Generando PDF...' : 'Comprar'}
              </button>
            </div>

            {modalStatus && <p className={styles.modalStatus}>{modalStatus}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function readCreatedEntrepreneurs() {
  try {
    const raw = localStorage.getItem(CREATED_ENTREPRENEURS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (_error) {
    return []
  }
}

function normalizeProduct(item = {}) {
  const priceInfo = resolvePrice(item)
  return {
    ...item,
    priceValue: priceInfo.value,
    priceLabel: priceInfo.label,
    whatsappUrl: resolveWhatsAppUrl(item),
  }
}

function resolvePrice(item) {
  const directPrice = Number(item.precio ?? item.price)
  if (Number.isFinite(directPrice) && directPrice > 0) {
    return { value: directPrice, label: formatCurrency(directPrice) }
  }

  if (typeof item.precio === 'string' && item.precio.trim()) {
    return { value: null, label: item.precio.trim() }
  }

  const match = extractPriceToken(item.nombre) || extractPriceToken(item.descripcion)
  if (match) {
    return { value: null, label: normalizePriceLabel(match) }
  }

  return { value: null, label: '' }
}

function extractPriceToken(text) {
  if (typeof text !== 'string' || !text.trim()) return ''
  const matched = text.match(/(?:precio\s*(?:de)?\s*)?((?:Q|USD|\$)\s*\d+(?:[.,]\d{1,2})?)/i)
  return matched?.[1] || ''
}

function normalizePriceLabel(rawLabel) {
  const compact = rawLabel.replace(/\s+/g, ' ').trim()
  if (/^usd/i.test(compact)) return compact.toUpperCase()
  if (/^q\b/i.test(compact)) return compact.toUpperCase()
  return compact.startsWith('$') ? compact : `$${compact}`
}

function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''

  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

function resolveWhatsAppUrl(item) {
  const directPhone = sanitizePhone(item?.whatsapp || item?.telefono || '')
  const number = directPhone || DEFAULT_WHATSAPP_NUMBER
  const message = composeWhatsAppMessage(item)

  if (number) {
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
  }

  const externalLink = typeof item?.enlace === 'string' ? item.enlace.trim() : ''
  if (/wa\.me|whatsapp\.com/i.test(externalLink)) {
    return externalLink
  }

  return ''
}

function composeWhatsAppMessage(item) {
  const name = item?.nombre || 'tu producto'
  const price = item?.priceLabel ? ` por ${item.priceLabel}` : ''
  return `Hola, me interesa ${name}${price}. ¿Podemos coordinar entrega y pago en efectivo?`
}

function sanitizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}
