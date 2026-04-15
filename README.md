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

## Notas importantes de Supabase

- El registro de usuarios se guarda en `auth.users` de Supabase.
- Si tienes activa la confirmación por correo, el usuario debe verificar email antes de iniciar sesión.
- Para pruebas rápidas, puedes desactivar temporalmente la confirmación en `Authentication > Providers > Email`.

## Rutas frontend

- `/` y `/login`: formulario de registro/login
- `/emprendimientos`: listado de emprendimientos
- `/crear`: crear emprendimiento (placeholder)
- `/perfil`: perfil (placeholder)
