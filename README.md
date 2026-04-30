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
- `/crear`: flujo IA de creación de emprendimiento con previsualización
- `/perfil`: perfil (placeholder)
