# Supervisión del Hogar 📱

Aplicación móvil del TPF 159 (2025c2) para la **supervisión del hogar**: permite gestionar casas, sus integrantes y sensores IoT (movimiento, magnético, gas y sonido), recibir notificaciones push ante eventos y emparejar sensores por Bluetooth.

Construida con [Expo](https://expo.dev) / React Native y [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing).

## Stack principal

| Área | Tecnología |
| --- | --- |
| Framework | React Native `0.81` + Expo SDK `54` (New Architecture, React Compiler) |
| Routing | Expo Router `6` (typed routes) |
| UI | React Native Paper `5` (Material Design 3, tema personalizado) |
| Estado | Zustand (auth, persistido en AsyncStorage) |
| Data fetching | TanStack React Query `5` |
| Bluetooth | `react-native-ble-plx` (emparejamiento de sensores) |
| Notificaciones | `expo-notifications` (push) |
| Lenguaje | TypeScript |

## Estructura del proyecto

```
app/                       # Rutas (file-based routing de Expo Router)
  index.tsx                # Entry / redirección según auth
  login.tsx                # Inicio de sesión
  register.tsx             # Registro
  (protected)/             # Rutas que requieren sesión
    (tabs)/                # Navegación por tabs
      houses/              # CRUD de casas
        [id]/
          members/         # Integrantes de la casa (roles, invitaciones)
          sensors/         # Sensores: alta, edición, pairing BLE, configuración
      settings/            # Preferencias del usuario y notificaciones
components/                # Componentes reutilizables (cards, header, logo, etc.)
services/                  # Cliente HTTP del backend + tipos de dominio
  authService.ts           # Login/registro, manejo de tokens y refresh
  houseService.ts          # Casas, integrantes, sensores, lecturas, notif. rules
  notificationService.ts   # Permisos y push token (no-op en Expo Go)
  userService.ts           # Datos y preferencias del usuario
  config.ts                # Resolución de API_URL (v1 / v2)
  types.ts                 # Interfaces y constantes de dominio
hooks/                     # useAuthStore, useNotifications, color scheme, theme
constants/                 # theme.ts
assets/                    # Íconos, imágenes y fuentes
```

## Requisitos previos

- [Node.js](https://nodejs.org/) 20+
- [npm](https://www.npmjs.com/)
- Para builds/EAS: una cuenta de [Expo](https://expo.dev) y la CLI de EAS
- Para correr en dispositivo: la app **Expo Go** o un *development build* (Bluetooth y notificaciones push requieren development build, no funcionan en Expo Go)

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

   > El proyecto usa `legacy-peer-deps=true` (ver `.npmrc`).

2. Configurar el entorno. La URL del backend se toma de la variable pública `EXPO_PUBLIC_API_URL` (ver `.env`):

   ```bash
   EXPO_PUBLIC_API_URL=https://tpf-backend-3f5b66fb6904.herokuapp.com/api/v1
   ```

   Si no se define, se usa `http://localhost:3000/api/v1` por defecto.

3. Levantar la app:

   ```bash
   npm start
   ```

   Desde la salida se puede abrir en un *development build*, emulador de Android, simulador de iOS o Expo Go.

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run start-tunnel` | Inicia Expo con tunnel (`--tunnel`) |
| `npm run android` | Compila y corre en Android (`expo run:android`) |
| `npm run ios` | Compila y corre en iOS (`expo run:ios`) |
| `npm run web` | Corre la versión web |
| `npm run lint` | Linter (`expo lint`) |
| `npm run reset-project` | Mueve el código de ejemplo y deja `app/` en blanco |

## Configuración relevante

- **Alias de imports**: `@/*` apunta a la raíz del proyecto (configurado en `babel.config.js` y `tsconfig.json`). Ej: `import authService from "@/services/authService"`.
- **Tema**: definido en `app/_layout.tsx` (`lightTheme`) sobre React Native Paper. Color primario `#1D9E75`.
- **Android**: package `com.tpf159.supervisionhogar`, usa `google-services.json` para notificaciones (FCM).
- **Permisos BLE**: configurados en `app.json` vía el plugin de `react-native-ble-plx` (background, central/peripheral).

## Builds con EAS

Los perfiles de build están en `eas.json`:

- **development**: development client, APK, distribución interna.
- **preview**: APK interna, apunta al backend de producción (Heroku).
- **production**: con `autoIncrement` de versión.

Build manual de Android (perfil preview):

```bash
eas build --platform android --profile preview
```

## CI/CD

El workflow `.github/workflows/build.yml` ejecuta automáticamente un **build de APK (perfil preview) en EAS** ante cada push a `main`:

1. Checkout del repo
2. Setup de Node 20 y EAS CLI
3. `npm ci`
4. `eas build --platform android --profile preview --non-interactive --no-wait`

Requiere el secret `EXPO_TOKEN` configurado en el repositorio de GitHub.

## Backend

La app consume la API REST del [backend del TPF](https://tpf-backend-3f5b66fb6904.herokuapp.com). La autenticación usa access/refresh tokens (JWT) almacenados en AsyncStorage; `authService.fetchWithAuth` adjunta el token y refresca la sesión automáticamente.
