# Aurum Android — Guía de build

La app Android es un shell de Capacitor que carga la web desplegada en Vercel.
Plan completo: [`android-app-plan.md`](./android-app-plan.md).

## Requisitos locales
- Node 20+ y `npm ci`
- JDK 21
- Android Studio (o Android SDK con `platforms;android-36` y `build-tools;36.0.0`)

## URL que carga la app
`capacitor.config.ts` lee `CAP_SERVER_URL` al hacer `cap sync`:

```bash
CAP_SERVER_URL=https://<tu-dominio>.vercel.app npm run cap:sync
```

Para probar contra el dev server en la red local: `CAP_SERVER_URL=http://192.168.x.x:3000 npm run cap:sync`
(se habilita `cleartext` automáticamente para `http://`).

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run cap:sync` | Copia `native-shell/` y la config al proyecto Android |
| `npm run android:open` | Abre el proyecto en Android Studio |
| `npm run android:build` | APK debug → `android/app/build/outputs/apk/debug/app-debug.apk` |
| `npm run android:release` | APK release (firmado si existen las variables de keystore) |
| `npm run android:assets` | Regenera iconos y splash desde `assets/` |

Instalar en un teléfono con depuración USB: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

## CI (GitHub Actions — `.github/workflows/android.yml`)
Se ejecuta manualmente (*Run workflow*) o al cambiar archivos nativos en `main`. El APK queda como artefacto.

Configurar en *Settings → Secrets and variables → Actions*:

| Tipo | Nombre | Valor |
|---|---|---|
| Variable | `CAP_SERVER_URL` | URL de producción |
| Secret | `ANDROID_KEYSTORE_BASE64` | `base64 -w0 aurum.jks` |
| Secret | `ANDROID_KEYSTORE_PASSWORD` | contraseña del keystore |
| Secret | `ANDROID_KEY_ALIAS` | alias de la llave |
| Secret | `ANDROID_KEY_PASSWORD` | contraseña de la llave |
| Secret | `GOOGLE_SERVICES_JSON` | contenido de `google-services.json` (Fase 4, push) |

Crear el keystore (una sola vez, **guardar respaldo**; sin él no se puede actualizar la app):

```bash
keytool -genkeypair -v -keystore aurum.jks -alias aurum -keyalg RSA -keysize 2048 -validity 10000
```

## Qué hace la capa nativa (Fase 1)
- `providers/NativeProvider.tsx` → `useNativeShellViewModel`: oculta el splash al montar, ajusta el estilo de las barras del sistema al tema, y maneja el botón atrás (cierra modal/menú → navega atrás → sale en `/`, `/login`, `/register`).
- `lib/native/back-button.ts`: pila de overlays; `Modal`, `MobileNav` y `FloatingMenu` se registran con `useBackHandler`.
- Pantalla de borde a borde: el layout usa `env(safe-area-inset-*)` (vale `0` en navegadores de escritorio, así que la web no cambia).
- `OfflineBanner`: aviso cuando no hay conexión (también en la web). Sin red al abrir, se muestra `native-shell/offline.html`.
