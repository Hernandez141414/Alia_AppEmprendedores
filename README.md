# Alia App - Entrepreneurs Platform

## Descripción

Aplicación web que conecta emprendedores, permitiéndoles promocionar productos y servicios, generar catálogos y colaborar en una comunidad en crecimiento.

## Características (Fase 1)

✅ **Login** - Página de autenticación con validación básica  
✅ **Página de Emprendimientos** - Grid de 4 cards/fila, paginación cada 12 cards (3 filas)  
✅ **Navbar** - Navegación con búsqueda, tabs y logo  
✅ **Diseño Responsivo** - Mobile-first con breakpoints optimizados  
✅ **Mock Data** - 20 emprendimientos de ejemplo  

## Stack Tecnológico

- **React 18** - Interfaz reactiva
- **Vite** - Build rápida y desarrollo optimizado
- **React Router v6** - Navegación entre páginas
- **CSS Modules** - Estilos scoped sin conflictos
- **Node.js** - Runtime y package manager

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

## Build

```bash
npm run build
```

Genera los archivos de producción en la carpeta `dist/`

## Rutas

- `/` - Home (redirige a login)
- `/login` - Página de inicio de sesión
- `/emprendimientos` - Catálogo de emprendimientos
- `/crear` - Crear nuevo emprendimiento (placeholder)
- `/perfil` - Perfil de usuario (placeholder)

## Estructura de Carpetas

```
src/
├── components/
│   ├── Navbar.jsx
│   ├── Card.jsx
│   ├── Pagination.jsx
│   └── ...
├── pages/
│   ├── Login.jsx
│   ├── Entrepreneurs.jsx
│   ├── CreateEntrepreneur.jsx
│   └── Profile.jsx
├── data/
│   └── entrepreneurs.json
├── services/
│   └── aiService.js
├── styles/
│   ├── global.css
│   └── *.module.css
└── App.jsx
```

## Próximas Fases

- [ ] Integración con IA (descripciones de productos, optimización de imágenes)
- [ ] Backend API (autenticación real, base de datos)
- [ ] Sistema de catálogos
- [ ] Búsqueda y filtros avanzados
- [ ] Sistema de comentarios/reseñas
- [ ] Directorio de enlaces entre emprendimientos
