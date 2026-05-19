const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function getMyProfile() {
  return authorizedJson('/api/profile/me', { method: 'GET' })
}

export async function updateMyProfile({ businessName, businessDescription }) {
  return authorizedJson('/api/profile/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ businessName, businessDescription }),
  })
}

export async function updateMyProfilePhoto(file) {
  const token = getAccessToken()
  if (!token) {
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.')
  }

  const formData = new FormData()
  formData.append('photo', file)

  const response = await fetch(`${API_URL}/api/profile/me/photo`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message || 'No se pudo actualizar la foto del negocio.')
  }

  return body
}

async function authorizedJson(path, options = {}) {
  const token = getAccessToken()
  if (!token) {
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.message || 'No se pudo completar la solicitud.')
  }

  return body
}

function getAccessToken() {
  try {
    const authRaw = localStorage.getItem('alia_auth')
    if (!authRaw) return ''
    const session = JSON.parse(authRaw)
    return session?.accessToken || ''
  } catch (_error) {
    return ''
  }
}
