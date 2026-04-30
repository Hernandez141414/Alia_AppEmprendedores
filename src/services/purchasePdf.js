import { jsPDF } from 'jspdf'

export async function generatePurchasePdf(item) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 44
  const printableWidth = pageWidth - margin * 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Comprobante de compra', margin, 56)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Fecha: ${new Date().toLocaleString('es-GT')}`, margin, 80)

  let cursorY = 112
  const imageData = await loadPreviewDataUrl(item.preview)

  if (imageData) {
    const imageFormat = inferImageFormat(imageData)
    const frameHeight = 240
    const imageBox = await fitImageToBox(imageData, printableWidth, frameHeight)

    doc.setDrawColor(226, 232, 236)
    doc.setFillColor(248, 251, 252)
    doc.roundedRect(margin, cursorY, printableWidth, frameHeight, 8, 8, 'FD')

    doc.addImage(
      imageData,
      imageFormat,
      margin + imageBox.offsetX,
      cursorY + imageBox.offsetY,
      imageBox.width,
      imageBox.height
    )
    cursorY += frameHeight + 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(sanitizePdfText(item.nombre || 'Producto'), margin, cursorY)
  cursorY += 24

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`Precio: ${resolvePdfPrice(item)}`, margin, cursorY)
  cursorY += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  const description = sanitizePdfText(item.descripcion?.trim() || 'Sin descripción')
  const descriptionLines = doc.splitTextToSize(description, printableWidth)
  doc.text(descriptionLines, margin, cursorY)
  cursorY += descriptionLines.length * 16 + 28

  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text(
    'Gracias por tu compra en Alia App Emprendedores.',
    margin,
    Math.min(cursorY, doc.internal.pageSize.getHeight() - 32)
  )

  const safeName = sanitizeFileName(item.nombre || 'producto')
  doc.save(`compra-${safeName}.pdf`)
}

function toCurrency(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return ''
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(numeric)
}

function resolvePdfPrice(item) {
  const label = typeof item?.priceLabel === 'string' ? item.priceLabel.trim() : ''
  if (label) return sanitizePdfText(label)

  const currency = toCurrency(item?.priceValue ?? item?.precio)
  if (currency) return sanitizePdfText(currency)

  return 'No especificado'
}

async function fitImageToBox(dataUrl, boxWidth, boxHeight) {
  const size = await readImageSize(dataUrl)
  const widthRatio = boxWidth / size.width
  const heightRatio = boxHeight / size.height
  const ratio = Math.min(widthRatio, heightRatio)

  const width = Math.max(1, Math.round(size.width * ratio))
  const height = Math.max(1, Math.round(size.height * ratio))
  const offsetX = Math.round((boxWidth - width) / 2)
  const offsetY = Math.round((boxHeight - height) / 2)

  return { width, height, offsetX, offsetY }
}

function readImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width || 1,
        height: img.naturalHeight || img.height || 1,
      })
    }
    img.onerror = () => reject(new Error('No se pudo leer el tamaño de la imagen.'))
    img.src = dataUrl
  })
}

async function loadPreviewDataUrl(source) {
  if (!source || typeof source !== 'string') return null

  if (source.startsWith('data:image/')) {
    return source
  }

  try {
    const response = await fetch(source)
    if (!response.ok) return null
    const blob = await response.blob()
    return await blobToDataUrl(blob)
  } catch (_error) {
    return null
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(blob)
  })
}

function inferImageFormat(dataUrl) {
  if (typeof dataUrl !== 'string') return 'JPEG'
  if (dataUrl.startsWith('data:image/png')) return 'PNG'
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP'
  return 'JPEG'
}

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

function sanitizePdfText(text) {
  const normalized = String(text || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\n\r\t]/g, (char) => {
      const map = {
        á: 'a',
        à: 'a',
        ä: 'a',
        â: 'a',
        Á: 'A',
        À: 'A',
        Ä: 'A',
        Â: 'A',
        é: 'e',
        è: 'e',
        ë: 'e',
        ê: 'e',
        É: 'E',
        È: 'E',
        Ë: 'E',
        Ê: 'E',
        í: 'i',
        ì: 'i',
        ï: 'i',
        î: 'i',
        Í: 'I',
        Ì: 'I',
        Ï: 'I',
        Î: 'I',
        ó: 'o',
        ò: 'o',
        ö: 'o',
        ô: 'o',
        Ó: 'O',
        Ò: 'O',
        Ö: 'O',
        Ô: 'O',
        ú: 'u',
        ù: 'u',
        ü: 'u',
        û: 'u',
        Ú: 'U',
        Ù: 'U',
        Ü: 'U',
        Û: 'U',
        ñ: 'n',
        Ñ: 'N',
        ç: 'c',
        Ç: 'C',
        '¡': '!',
        '¿': '?',
      }
      return map[char] || ' '
    })
    .replace(/[&]{2,}/g, '&')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return normalized || 'Sin descripcion'
}
