import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import styles from './Profile.module.css'
import { getMyProfile, updateMyProfile, updateMyProfilePhoto } from '../services/profileApi'

const DESCRIPTION_LIMIT = 500

export default function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const photoMenuRef = useRef(null)
  const photoButtonRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  useEffect(() => {
    if (!readAccessToken()) {
      clearSessionAndRedirect(navigate)
      return
    }
    loadProfile()
  }, [navigate])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isPhotoMenuOpen) return
      if (
        photoMenuRef.current &&
        !photoMenuRef.current.contains(event.target) &&
        photoButtonRef.current &&
        !photoButtonRef.current.contains(event.target)
      ) {
        setIsPhotoMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPhotoMenuOpen])

  async function loadProfile() {
    try {
      setIsLoading(true)
      setIsError(false)
      const response = await getMyProfile()
      setProfile(response.profile)
      setStatusMessage('Perfil mock listo para pruebas.')
    } catch (error) {
      setIsError(true)
      setStatusMessage(error.message || 'No pudimos cargar el perfil mock.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleLogout() {
    clearSessionAndRedirect(navigate)
  }

  function handleProfileFieldChange(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSaveName() {
    if (!profile || isSavingName) return
    try {
      setIsSavingName(true)
      const response = await updateMyProfile({
        businessName: profile.businessName,
        businessDescription: profile.businessDescription,
      })
      setProfile(response.profile)
      setStatusMessage('Nombre actualizado (mock).')
      setIsError(false)
    } catch (error) {
      setIsError(true)
      setStatusMessage(error.message || 'No se pudo actualizar el nombre.')
    } finally {
      setIsSavingName(false)
    }
  }

  async function handleSaveDescription() {
    if (!profile || isSavingDescription) return
    try {
      setIsSavingDescription(true)
      const response = await updateMyProfile({
        businessName: profile.businessName,
        businessDescription: profile.businessDescription,
      })
      setProfile(response.profile)
      setStatusMessage('Descripción actualizada (mock).')
      setIsError(false)
    } catch (error) {
      setIsError(true)
      setStatusMessage(error.message || 'No se pudo actualizar la descripción.')
    } finally {
      setIsSavingDescription(false)
    }
  }

  function triggerFilePicker() {
    fileInputRef.current?.click()
  }

  function handlePhotoClick() {
    if (!profile?.businessPhotoUrl) {
      triggerFilePicker()
      return
    }
    setIsPhotoMenuOpen((current) => !current)
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setIsError(true)
      setStatusMessage('Formato no válido. Usa PNG, JPG o WebP.')
      return
    }

    try {
      setIsUploadingPhoto(true)
      const response = await updateMyProfilePhoto(file)
      setProfile(response.profile)
      setStatusMessage('Foto actualizada (mock).')
      setIsError(false)
      setIsPhotoMenuOpen(false)
    } catch (error) {
      setIsError(true)
      setStatusMessage(error.message || 'No se pudo actualizar la foto.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Navbar currentPage="perfil" />
        <main className={styles.main}>
          <div className={styles.card}>
            <p className={styles.loading}>Cargando perfil...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Navbar currentPage="perfil" />
      <main className={styles.main}>
        <div className={styles.card}>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            <span aria-hidden="true">↪</span> Cerrar sesion
          </button>

          <h1 className={styles.title}>Mi Perfil</h1>

          {isError && (
            <div className={styles.errorBox}>
              <p>{statusMessage || 'Hubo un error al cargar el perfil.'}</p>
              <button type="button" onClick={loadProfile}>
                Reintentar
              </button>
            </div>
          )}

          {!isError && (
            <>
              <section className={styles.section}>
                <div className={styles.photoWrap}>
                  <button
                    ref={photoButtonRef}
                    type="button"
                    className={styles.photoButton}
                    onClick={handlePhotoClick}
                    disabled={isUploadingPhoto}
                    aria-label="Gestionar foto de negocio"
                  >
                    {profile?.businessPhotoUrl ? (
                      <img src={profile.businessPhotoUrl} alt="Foto de negocio" className={styles.photoImage} />
                    ) : (
                      <span className={styles.userIcon} aria-hidden="true">
                        👤
                      </span>
                    )}
                  </button>

                  {isPhotoMenuOpen && (
                    <div className={styles.photoMenu} ref={photoMenuRef}>
                      <button type="button" onClick={() => setIsPhotoModalOpen(true)}>
                        Ver foto
                      </button>
                      <button type="button" onClick={triggerFilePicker}>
                        Reemplazar foto
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className={styles.hiddenInput}
                    onChange={handlePhotoChange}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="business-name">Nombre del negocio</label>
                  <div className={styles.editableWrap}>
                    <input
                      id="business-name"
                      type="text"
                      value={profile?.businessName || ''}
                      placeholder="Agrega el nombre del negocio"
                      disabled={!isEditingName || isSavingName}
                      onChange={(event) => handleProfileFieldChange('businessName', event.target.value)}
                      onBlur={() => {
                        if (isEditingName) {
                          setIsEditingName(false)
                          handleSaveName()
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => setIsEditingName((current) => !current)}
                      aria-label="Editar nombre de negocio"
                    >
                      ✎
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="business-description">Descripción del negocio</label>
                  <div className={styles.editableWrap}>
                    <div className={styles.textAreaWrap}>
                      <textarea
                        id="business-description"
                        maxLength={DESCRIPTION_LIMIT}
                        value={profile?.businessDescription || ''}
                        placeholder="Agrega una descripción del negocio"
                        disabled={!isEditingDescription || isSavingDescription}
                        onChange={(event) => handleProfileFieldChange('businessDescription', event.target.value)}
                        onBlur={() => {
                          if (isEditingDescription) {
                            setIsEditingDescription(false)
                            handleSaveDescription()
                          }
                        }}
                      />
                      <span className={styles.counter}>
                        {(profile?.businessDescription || '').length}/{DESCRIPTION_LIMIT}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => setIsEditingDescription((current) => !current)}
                      aria-label="Editar descripción de negocio"
                    >
                      ✎
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="account-email">Correo de cuenta</label>
                  <input id="account-email" type="text" value={profile?.accountEmail || ''} disabled />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="account-name">Nombre de cuenta</label>
                  <input id="account-name" type="text" value={profile?.accountFullName || ''} disabled />
                </div>

                <p className={styles.statusText}>
                  {statusMessage || 'Aquí verás estados de guardado, carga de foto y validaciones.'}
                </p>
              </section>
            </>
          )}
        </div>
      </main>

      {isPhotoModalOpen && profile?.businessPhotoUrl && (
        <div
          className={styles.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsPhotoModalOpen(false)
          }}
        >
          <div className={styles.modal}>
            <button type="button" className={styles.modalClose} onClick={() => setIsPhotoModalOpen(false)}>
              ×
            </button>
            <img src={profile.businessPhotoUrl} alt="Vista completa de la foto del negocio" />
          </div>
        </div>
      )}
    </div>
  )
}

function readAccessToken() {
  try {
    const raw = localStorage.getItem('alia_auth')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.accessToken || ''
  } catch (_error) {
    return ''
  }
}

function clearSessionAndRedirect(navigate) {
  localStorage.removeItem('alia_auth')
  navigate('/login')
}
