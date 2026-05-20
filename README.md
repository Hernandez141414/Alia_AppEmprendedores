# Alia App - Entrepreneurs Platform

## Descripción

Aplicación web para emprendedores y pequeños comercios. Esta fase incluye autenticación real (registro e inicio de sesión) usando backend en Express + Supabase Auth.

## Stack Tecnológico

- React 18 + Vite
- React Router v6
- CSS Modules
- Node.js + Express
- Supabase Auth

## Instalación

```bash
npm install
```

## Configuración de entorno

1. Copia `.env.example` a `.env`
2. Completa las variables:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_TEXT_MODEL=gemini-2.5-flash
VITE_DEFAULT_WHATSAPP=50255555555
```

## Ejecutar proyecto

Frontend (Vite):

```bash
npm run dev
```

Backend (Express):

```bash
npm run dev:server
```

## Endpoints backend

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (requiere `Authorization: Bearer <token>`)
- `POST /api/ai/generate-description` (form-data: `notes`, opcional `audio`)
- `POST /api/ai/finalize` (json: descripción final para guardar borrador)
- `GET /api/ai/finalize/:id`

## Persistencia en Supabase para Crear Emprendimiento

1. En Supabase, abre `SQL Editor`.
2. Ejecuta el script:
   - `supabase/setup_creation_drafts.sql`
3. En tu `.env`, asegúrate de agregar:
   - `SUPABASE_SERVICE_ROLE_KEY=...`

Con esto, el endpoint `POST /api/ai/finalize` guardará borradores en la tabla `public.creation_drafts`.

Los endpoints de IA usan Gemini:
- `POST /api/ai/generate-description`: toma audio/texto y devuelve opciones de descripción.
- Si `generate-description` devuelve `429`, revisa cuota/facturación de Gemini para tu proyecto.

## Notas importantes de Supabase

- El registro de usuarios se guarda en `auth.users` de Supabase.
- Si tienes activa la confirmación por correo, el usuario debe verificar email antes de iniciar sesión.
- Para pruebas rápidas, puedes desactivar temporalmente la confirmación en `Authentication > Providers > Email`.

## Rutas frontend

- `/` y `/login`: formulario de registro/login
- `/emprendimientos`: listado de emprendimientos
- `/crear`: flujo IA de creación de emprendimiento con previsualización y campo de WhatsApp
- `/perfil`: perfil (placeholder)

En el modal de "Ver más", el botón "Comunícate" abre WhatsApp.
- Si el producto trae un número propio (`whatsapp` o `telefono`), usa ese.
- Si no trae número, usa `VITE_DEFAULT_WHATSAPP`.

## Novedades recientes (Perfil)

- Se implementó la vista `/perfil` con layout responsive y campos de negocio/cuenta, incluyendo edición de nombre y descripción, manejo de foto (subir, reemplazar y ver en modal) y botón de cerrar sesión.
- Se agregaron endpoints backend para perfil:
  - `GET /api/profile/me`
  - `PUT /api/profile/me`
  - `PUT /api/profile/me/photo`
- Se agregó script SQL para la tabla de perfil de emprendedor:
  - `supabase/setup_entrepreneur_profiles.sql`
- Importante: si no ejecutas ese SQL en Supabase, `/perfil` puede fallar por tabla faltante (`public.entrepreneur_profiles`).
- Rama `profile-mock`: contiene versión mock de perfil para pruebas visuales sin depender de la base de datos.
- Rama `profile-page`: contiene versión conectada al backend/Supabase.
