import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import styles from './CreateEntrepreneur.module.css'
import {
  finalizeCreationDraft,
  requestDescriptionGeneration,
} from '../services/creatorAiApi'

export default function CreateEntrepreneur() {
  const navigate = useNavigate()
  const [productName, setProductName] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [productImage, setProductImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [audioBlob, setAudioBlob] = useState(null)
  const [descriptionOptions, setDescriptionOptions] = useState([])
  const [selectedDescription, setSelectedDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalDraftId, setFinalDraftId] = useState('')
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)

  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl)
    }
  }, [previewUrl, audioUrl])

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Selecciona una imagen válida (PNG, JPG o WebP).')
      setIsError(true)
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    const nextUrl = URL.createObjectURL(file)
    setProductImage(file)
    setPreviewUrl(nextUrl)
    setDescriptionOptions([])
    setSelectedDescription('')
    setFinalDraftId('')
    setStatus('Imagen cargada correctamente.')
    setIsError(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    handleFileSelect(file)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setIsDragging(false)
  }

  const toggleRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setStatus('Tu navegador no soporta grabación de audio.')
      setIsError(true)
      return
    }

    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioUrl) URL.revokeObjectURL(audioUrl)

        const newAudioUrl = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(newAudioUrl)
        setStatus('Nota de audio guardada.')
        setIsError(false)

        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
      setStatus('Grabando audio... vuelve a tocar para detener.')
      setIsError(false)
    } catch (_error) {
      setStatus('No se pudo acceder al micrófono. Revisa permisos del navegador.')
      setIsError(true)
    }
  }

  const handleGenerate = async () => {
    if (!productImage) {
      setStatus('Sube una imagen para generar la descripción.')
      setIsError(true)
      return
    }

    if (!notes.trim() && !audioBlob) {
      setStatus('Agrega texto o audio para describir mejor tu producto.')
      setIsError(true)
      return
    }

    try {
      setIsGenerating(true)
      setStatus('Generando descripción...')
      setIsError(false)

      const response = await requestDescriptionGeneration({ notes, audioBlob })
      const firstOption = response.options?.[0]?.text || ''

      setDescriptionOptions(response.options || [])
      setSelectedDescription(firstOption)
      setFinalDraftId('')
      setStatus('Opciones creadas. Revisa y edita antes de finalizar.')
      setIsError(false)
    } catch (error) {
      setStatus(error.message || 'No se pudo generar la descripción.')
      setIsError(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFinalize = async () => {
    if (!selectedDescription.trim()) {
      setStatus('Debes elegir o escribir una descripción final.')
      setIsError(true)
      return
    }

    const cleanWhatsapp = sanitizePhone(whatsappNumber)
    if (whatsappNumber.trim() && cleanWhatsapp.length < 8) {
      setStatus('El número de WhatsApp parece incompleto. Revisa el formato internacional.')
      setIsError(true)
      return
    }

    try {
      setIsFinalizing(true)
      setStatus('Guardando borrador final...')
      setIsError(false)

      const response = await finalizeCreationDraft({
        selectedDescription,
        notes,
        hasAudio: Boolean(audioBlob),
        imageMode: 'original',
        imageName: productImage?.name || null,
      })

      const previewForCard = await buildCardPreview({
        productImage,
        previewUrl,
      })

      appendCreatedEntrepreneur({
        id: `draft-${response.draft.id}`,
        nombre: productName.trim() || inferProductName(notes),
        descripcion: selectedDescription.trim(),
        preview: previewForCard,
        enlace: '#',
        whatsapp: cleanWhatsapp || null,
        createdAt: response.draft.createdAt,
      })

      setFinalDraftId(response.draft.id)
      setStatus('Guardado con éxito. Te llevamos a Emprendimientos...')
      setIsError(false)
      window.setTimeout(() => navigate('/emprendimientos'), 450)
    } catch (error) {
      setStatus(error.message || 'No se pudo guardar el borrador final.')
      setIsError(true)
    } finally {
      setIsFinalizing(false)
    }
  }

  const handleRestart = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl)

    setProductImage(null)
    setPreviewUrl('')
    setProductName('')
    setWhatsappNumber('')
    setNotes('')
    setAudioBlob(null)
    setAudioUrl('')
    setDescriptionOptions([])
    setSelectedDescription('')
    setFinalDraftId('')
    setStatus('Proceso reiniciado. Puedes comenzar con un nuevo producto.')
    setIsError(false)
  }

  return (
    <div className={styles.page}>
      <Navbar currentPage="crear" />

      <main className={styles.wrapper}>
        <section className={styles.panel}>
          <header className={styles.hero}>
            <h1>Crea con IA</h1>
            <p>Rápido y fácil para emprendedores</p>
          </header>

          <div
            className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                fileInputRef.current?.click()
              }
            }}
          >
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleFileSelect(event.target.files?.[0])}
            />

            <div className={styles.uploadIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="4.5" width="17" height="15" rx="2.7" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="16.5" cy="9" r="1.4" fill="currentColor" />
                <path
                  d="m6.5 16 4.6-5 3.2 3.5 2.5-2.7L19.5 16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3>Arrastra y suelta tu imagen aquí</h3>
            <p>o haz clic para seleccionar un archivo</p>

            {previewUrl && (
              <div className={styles.previewWrap}>
                <img src={previewUrl} alt="Vista previa del producto" className={styles.previewImage} />
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
                    setPreviewUrl('')
                    setProductImage(null)
                    setDescriptionOptions([])
                    setSelectedDescription('')
                    setFinalDraftId('')
                    setStatus('Imagen eliminada.')
                    setIsError(false)
                  }}
                >
                  Quitar imagen
                </button>
              </div>
            )}
          </div>

          <div className={styles.inputGrid}>
            <div className={styles.fieldBlock}>
              <label htmlFor="product-name">Nombre del emprendimiento / producto</label>
              <input
                id="product-name"
                type="text"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                placeholder="Ejemplo: Jabón Natural Avena"
                className={styles.textInput}
              />

              <label htmlFor="product-whatsapp">WhatsApp para ventas</label>
              <input
                id="product-whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="Ejemplo: 50255554444"
                className={styles.textInput}
              />

              <label htmlFor="product-notes">Cuéntanos sobre tu producto</label>
              <textarea
                id="product-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ejemplo: Shampoo artesanal de romero, ideal para cabello mixto, aroma suave..."
              />
            </div>

            <div className={styles.fieldBlock}>
              <label>Nota de audio</label>
              <div className={styles.audioBox}>
                <button
                  type="button"
                  className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
                  onClick={toggleRecording}
                >
                  {isRecording ? 'Detener grabación' : 'Grabar audio'}
                </button>
                {audioUrl && <audio controls src={audioUrl} className={styles.audioPlayer} />}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn} onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generando...' : 'Generar descripción ✨'}
            </button>
          </div>

          {status && <p className={`${styles.status} ${isError ? styles.error : ''}`}>{status}</p>}

          <section className={styles.resultBox}>
            <h4>Descripción sugerida por IA (editable)</h4>

            {descriptionOptions.length > 0 && (
              <div className={styles.optionRow}>
                {descriptionOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.optionChip} ${
                      selectedDescription === option.text ? styles.optionChipActive : ''
                    }`}
                    onClick={() => setSelectedDescription(option.text)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            <textarea
              className={styles.resultEditor}
              placeholder="Aquí aparecerá la descripción generada para tu producto..."
              value={selectedDescription}
              onChange={(event) => setSelectedDescription(event.target.value)}
            />

            <div className={styles.finalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleRestart}
                disabled={isFinalizing || isGenerating}
              >
                Iniciar de nuevo
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleFinalize}
                disabled={isFinalizing || !selectedDescription.trim()}
              >
                {isFinalizing ? 'Guardando...' : 'Guardar y ver emprendimientos'}
              </button>
            </div>

            {finalDraftId && <p className={styles.savedHint}>Borrador guardado con ID: {finalDraftId}</p>}
          </section>
        </section>
      </main>
    </div>
  )
}

const CREATED_ENTREPRENEURS_KEY = 'alia_created_entrepreneurs'

function appendCreatedEntrepreneur(item) {
  const current = readCreatedEntrepreneurs()
  localStorage.setItem(CREATED_ENTREPRENEURS_KEY, JSON.stringify([item, ...current]))
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

async function buildCardPreview({ productImage, previewUrl }) {
  if (productImage) {
    return fileToDataUrl(productImage)
  }

  return previewUrl || ''
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo procesar la imagen para la tarjeta.'))
    reader.readAsDataURL(file)
  })
}

function inferProductName(notes) {
  const clean = (notes || '').trim()
  if (!clean) return 'Nuevo emprendimiento IA'

  const candidate = clean
    .split(/\s+/)
    .slice(0, 4)
    .join(' ')
    .replace(/[.,;:!?]$/g, '')

  return candidate.length > 2 ? candidate : 'Nuevo emprendimiento IA'
}

function sanitizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}
