const PROFILE_MOCK_KEY = 'alia_profile_mock'

export async function getMyProfile() {
  return {
    message: 'Perfil mock cargado.',
    profile: readMockProfile(),
  }
}

export async function updateMyProfile({ businessName, businessDescription }) {
  const current = readMockProfile()
  const nextProfile = {
    ...current,
    businessName: String(businessName || '').slice(0, 120),
    businessDescription: String(businessDescription || '').slice(0, 500),
  }

  persistMockProfile(nextProfile)
  return {
    message: 'Perfil mock actualizado.',
    profile: nextProfile,
  }
}

export async function updateMyProfilePhoto(file) {
  const photoDataUrl = await fileToDataUrl(file)
  const current = readMockProfile()
  const nextProfile = {
    ...current,
    businessPhotoUrl: photoDataUrl,
  }

  persistMockProfile(nextProfile)
  return {
    message: 'Foto mock actualizada.',
    profile: nextProfile,
  }
}

function readMockProfile() {
  const user = readAuthUser()
  const base = {
    businessName: '',
    businessDescription: '',
    businessPhotoUrl: '',
    accountEmail: user?.email || 'usuario@ejemplo.com',
    accountFullName: user?.fullName || 'Emprendedor Alia',
  }

  try {
    const raw = localStorage.getItem(PROFILE_MOCK_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw)
    return {
      ...base,
      ...parsed,
      businessDescription: String(parsed?.businessDescription || '').slice(0, 500),
    }
  } catch (_error) {
    return base
  }
}

function persistMockProfile(profile) {
  localStorage.setItem(PROFILE_MOCK_KEY, JSON.stringify(profile))
}

function readAuthUser() {
  try {
    const raw = localStorage.getItem('alia_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.user || null
  } catch (_error) {
    return null
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo procesar la imagen.'))
    reader.readAsDataURL(file)
  })
}
