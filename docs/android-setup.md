# Aurum Android — Guía de build

La app Android es un shell de Capacitor que carga la web desplegada en Vercel.
Plan completo: [`android-app-plan.md`](./android-app-plan.md).

## Requisitos locales
- Node 20+ y `npm ci`
- JDK 21
- Android Studio (o Android SDK con `platforms;android-36` y `build-tools;36.0.0`)

## URL que carga la app
Por defecto la app carga **https://aurum.leineralvarado.dev** (producción).
Para otra URL, `capacitor.config.ts` lee `CAP_SERVER_URL` al hacer `cap sync`:

```bash
CAP_SERVER_URL=https://<preview>.vercel.app npm run cap:sync
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
| Variable (opcional) | `CAP_SERVER_URL` | Otra URL; por defecto producción |
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
- `providers/NativeProvider.tsx` → `useNativeShellViewModel`: oculta el splash al montar (con auto-ocultado de respaldo a los 2.5 s), ajusta el estilo de las barras del sistema al tema, y maneja el botón atrás (cierra modal/menú → navega atrás → sale en `/`, `/login`, `/register`).
- `lib/native/back-button.ts`: pila de overlays; `Modal`, `MobileNav` y `FloatingMenu` se registran con `useBackHandler`.
- Pantalla de borde a borde: el layout usa `env(safe-area-inset-*)` (vale `0` en navegadores de escritorio, así que la web no cambia).
- `OfflineBanner`: aviso cuando no hay conexión (también en la web). Sin red al abrir, se muestra `native-shell/offline.html`.

## Notificaciones en la app (Fase 4)
Guía de Firebase paso a paso: [`firebase-setup.md`](./firebase-setup.md).

Requisitos: backend de la Fase 3 desplegado ([`push-notifications-setup.md`](./push-notifications-setup.md)) y
`android/app/google-services.json` (de Firebase; está en `.gitignore`, en CI se restaura desde el secreto `GOOGLE_SERVICES_JSON`).
Sin ese archivo la app compila y funciona, pero no recibe push.

- **Registro**: al entrar al dashboard se crean los canales de Android (`budgets`, `recurring`, `goals`, `reminders`),
  se pide permiso **una sola vez** (Android 13+) y el token FCM se guarda con `register_device_token()`.
  Si el usuario lo rechazó, puede activarlo desde *Settings → Notifications*.
- **Al tocar una notificación** se abre su pantalla (`data.route`: `/budgets`, `/recurring`, `/goals`).
- **Con la app abierta** Android no muestra el banner; se muestra un toast.
- **Cerrar sesión** borra el token de este dispositivo (`unregister_device_token()`).
- **Settings → Notifications**: preferencias por tipo (se guardan en `notification_preferences`, aplican a todos
  los dispositivos y también se ven en la web) y un recordatorio diario local configurable (solo en este dispositivo).
- Icono de la barra de estado: `res/drawable/ic_stat_notification.xml` (silueta blanca; color `#F59E0B`).

Probar un push manualmente (SQL editor), con la app instalada y la sesión iniciada:
```sql
select public.enqueue_notification('<user-uuid>', 'goal_reached', 'Test', 'Hello from Aurum', '/goals');
```

## Experiencia nativa (Fases 2 y 5)
- **Vibración** (`lib/native/haptics.ts`): cada toast vibra según su tipo (éxito, advertencia o error), y también al abrir el menú flotante.
- **Teclado**: `Keyboard.resizeOnFullScreen` ajusta la vista y el campo enfocado se desplaza para quedar visible.
- **Exportar CSV**: en la app guarda el archivo y abre la hoja de compartir de Android; en la web se descarga como antes.
- **Bloqueo de la app** (*Settings → Security*, solo en la app): huella, rostro o PIN del teléfono. Pide desbloqueo al abrir
  la app en frío y al volver después de 30 s en segundo plano. No lo pide justo después de iniciar sesión con contraseña.
  Activarlo o desactivarlo exige verificar primero.
- **Accesos directos** (mantener presionado el icono): *Add expense* / *Add income* → `aurum://expenses?new=expense|income`,
  que abre el formulario. El esquema `aurum://` solo acepta rutas conocidas de la app.
- **Pendiente: App Links** (que `https://aurum.leineralvarado.dev/...` abra la app): requiere el keystore de release
  para publicar `/.well-known/assetlinks.json` con su huella SHA-256.
