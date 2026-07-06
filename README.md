# Casa — app de gestión del hogar

Backend Express + MongoDB (Mongoose) y frontend React (Vite + React Router), servidos
desde una única URL: el servidor Express sirve la API bajo `/api/*` y, en producción,
también sirve el frontend ya compilado. Un solo despliegue, una sola URL.

## Estructura

```
casa-app/
├── server/          Backend Express
│   ├── models/       Esquemas de MongoDB (User, Household, Event, ...)
│   ├── routes/       Rutas de la API
│   ├── middleware/   Verificación de sesión (JWT)
│   └── index.js      Servidor principal
└── client/          Frontend React (Vite)
    └── src/
        ├── pages/       Una página por sección
        ├── components/  Layout y sidebar
        └── context/     Sesión de usuario
```

## Cómo funciona la cuenta compartida

Cada persona se registra con su propio email y contraseña. Al registrarte puedes:
- **Crear una casa nueva** → se genera un código de invitación.
- **Unirte con un código** → entras en la misma casa que la otra persona, y a partir
  de ahí veis los mismos datos (calendario, compra, gastos, tareas, menú, notas...).

El código de invitación se puede consultar y copiar en cualquier momento desde
"Perfil de la casa" dentro de la app.

## 1. Requisitos

- Node.js 18 o superior
- Una base de datos MongoDB. La forma más simple es un cluster gratuito en
  [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).

## 2. Configuración

1. Copia `.env.example` a `.env` en la raíz del proyecto:
   ```
   cp .env.example .env
   ```
2. Rellena `MONGODB_URI` con tu cadena de conexión de Atlas (Database → Connect →
   Drivers) y `JWT_SECRET` con cualquier cadena larga aleatoria.
3. En Atlas, asegúrate de permitir el acceso desde tu IP (o desde `0.0.0.0/0` si vas
   a desplegar en un servicio como Render, que usa IPs dinámicas).

## 3. Desarrollo local

```bash
npm run install:all   # instala dependencias del backend y del frontend
npm run dev           # arranca backend (puerto 4000) y frontend (puerto 5173) a la vez
```

Abre `http://localhost:5173`. El frontend redirige las llamadas a `/api` hacia el
backend automáticamente (configurado en `client/vite.config.js`).

## 4. Producción (una sola URL)

```bash
npm run build   # compila el frontend a client/dist
npm start       # arranca el servidor Express, que sirve la API y el frontend compilado
```

Con esto, todo —API y frontend— se sirve desde el mismo puerto/URL.

## 5. Desplegar en GitHub + Render (o similar)

1. Sube este proyecto a un repositorio de GitHub.
2. En [Render](https://render.com) (o Railway/Fly.io), crea un **Web Service** nuevo
   apuntando a ese repositorio.
3. Configura:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Variables de entorno:** `MONGODB_URI` y `JWT_SECRET` (las mismas que en tu `.env`)
4. Despliega. Render te da una única URL (`https://tu-app.onrender.com`) que sirve
   tanto la API como la aplicación — no hay que desplegar frontend y backend por
   separado.

## Notas

- El modo oscuro es una preferencia guardada por usuario (no se comparte entre los
  miembros de la casa).
- Los presupuestos mensuales se guardan a nivel de casa (compartidos).
- Esta primera versión no incluye recuperación de contraseña ni verificación de
  email; si te hace falta, dímelo y lo añadimos.
