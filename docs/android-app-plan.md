# Aurum Android — Plan de app nativa (APK)

> Estado: **Fases 1–4 completadas, Fase 5 parcial** (falta App Links) (shell Capacitor; backend de notificaciones → [`push-notifications-setup.md`](./push-notifications-setup.md)) · ver [`android-setup.md`](./android-setup.md)
>
> Estado original: **Propuesta** · Fecha: 2026-11-07 · Alcance: Android (APK / AAB). iOS queda preparado pero fuera de alcance.

## 1. Objetivo

Publicar Aurum como app Android instalable (APK, y opcionalmente Play Store) que:

1. **Comparta el mismo frontend** que la web (mismo código, mismo estilo Tailwind, mismos ViewModels).
2. **La web siga funcionando igual** en Vercel, sin regresiones.
3. Se sienta **lo más nativa posible**: notificaciones push reales, notificaciones locales, botón "atrás" de Android, splash screen, barra de estado, háptica, biometría, compartir/exportar archivos, deep links y accesos directos.

## 2. Análisis de la app actual (lo que condiciona la decisión)

| Hallazgo en el código | Implicación |
|---|---|
| Next.js 16 App Router con `middleware.ts` que protege rutas con la sesión de Supabase por cookies (`@supabase/ssr`) | La app **necesita servidor**. No es viable `output: "export"` (estático) sin reescribir la autenticación. |
| Rutas de servidor: `app/(auth)/callback/route.ts`, `app/api/api-tokens`, `app/api/gmail-addon`, `app/api/cron/exchange-rates` | Deben seguir en Vercel; la app las consume vía la misma URL. |
| Todas las páginas del dashboard son `"use client"` y leen datos con el cliente browser de Supabase + Redux | Funcionan perfectamente dentro de un WebView. |
| Ya existe PWA (`@ducanh2912/next-pwa`, `app/manifest.ts`, iconos 192/512) | Base lista para iconos/splash; el service worker puede convivir. |
| Alertas de presupuesto (`useBudgetAlertsViewModel`) son **toasts in-app**, solo con la app abierta | Para notificaciones reales hay que moverlas al **servidor**. |
| Recurrentes se generan **en el cliente** al abrir la app (`processRecurringThunk`) | Si el usuario no abre la app, no se generan ni se puede notificar → mover a **pg_cron**. |
| `lib/export.ts` descarga CSV con `<a download>` | En WebView Android eso no funciona → usar Filesystem + Share nativos. |
| `localStorage` en `useAccountSelectionViewModel` | Funciona en WebView (persistente). Sin cambios. |
| `navigator.clipboard` en `ApiTokenSection` | Funciona; opcionalmente usar `@capacitor/clipboard`. |
| Realtime Supabase (`useRealtimeSyncViewModel`) | Funciona en WebView mientras la app está en primer plano. |

## 3. Alternativas evaluadas

| Opción | Mismo estilo | Web intacta | Nativo (push, biometría, etc.) | Esfuerzo | Veredicto |
|---|---|---|---|---|---|
| **A. Capacitor (shell nativo + URL remota)** | ✅ 100% mismo código | ✅ | ✅ Plugins nativos reales (FCM, biometría, filesystem, háptica…) | Bajo–medio | **Recomendada** |
| B. TWA (Trusted Web Activity / Bubblewrap) | ✅ | ✅ | ⚠️ Solo Web Push y APIs web; sin biometría, sin widgets, sin back nativo controlable | Muy bajo | Insuficiente para "lo más nativo posible" |
| C. Capacitor con export estático (bundle local) | ✅ | ⚠️ Requiere quitar middleware/SSR y rehacer auth | ✅ + offline real | Alto | No compensa ahora |
| D. React Native / Expo (reescritura) | ❌ Hay que rehacer toda la UI | ✅ | ✅✅ | Muy alto | Descartada |
| E. Kotlin nativo | ❌ | ✅ | ✅✅ | Muy alto | Descartada |

**Decisión: Opción A — Capacitor** cargando la app desplegada en Vercel (`server.url`) con el bridge nativo habilitado para ese dominio. Una sola base de código, cada deploy web actualiza la app al instante (sin publicar APK nuevo salvo cambios nativos), y acceso completo a APIs nativas.

## 4. Tecnologías

| Capa | Tecnología | Uso |
|---|---|---|
| Runtime nativo | **Capacitor 8.x** (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) | Shell Android + bridge JS ↔ nativo |
| Android | Android Studio, Gradle, **JDK 21**, Android SDK (target API 36, min API 24 — validar con la versión de Capacitor) | Compilar APK/AAB |
| Push | **Firebase Cloud Messaging (FCM)** + `@capacitor/push-notifications` | Notificaciones remotas |
| Notificaciones locales | `@capacitor/local-notifications` | Recordatorios programados en el dispositivo |
| Ciclo de vida / back | `@capacitor/app` | Botón atrás, `appStateChange`, deep links |
| UI nativa | `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/keyboard` | Splash, color de barra de estado, vibración, teclado |
| Archivos | `@capacitor/filesystem`, `@capacitor/share` | Exportar CSV y compartir |
| Red | `@capacitor/network` | Banner "sin conexión" |
| Preferencias | `@capacitor/preferences` | Ajustes nativos (p.ej. biometría activada) |
| Biometría | `@aparajita/capacitor-biometric-auth` (o `@capgo/capacitor-native-biometric`) | Desbloqueo con huella/rostro |
| Assets | `@capacitor/assets` | Generar iconos adaptativos y splash desde `public/logo.png` |
| Backend push | **Supabase Edge Function** `send-push` (Deno) + FCM HTTP v1 | Envío de notificaciones |
| Programación | **pg_cron** + **pg_net** (Supabase) | Recurrentes y recordatorios diarios en servidor |
| CI | GitHub Actions (`setup-java`, `gradle`) | Build y firma del APK |

## 5. Arquitectura

```
┌──────────── Android (APK) ────────────┐
│  MainActivity (Capacitor)             │
│   └─ WebView → https://<aurum>.vercel │◄── mismo Next.js que la web
│        ▲   window.Capacitor (bridge)  │
│        │                              │
│  Plugins nativos: Push, LocalNotif,   │
│  App, StatusBar, Haptics, Biometric,  │
│  Filesystem, Share, Network           │
└────────┬──────────────────────────────┘
         │ token FCM
         ▼
  Supabase  ── tabla device_tokens (RLS)
     │  pg_cron (recurrentes, recordatorios)
     │  trigger/webhook en expenses (presupuestos)
     ▼
  Edge Function send-push ──► FCM HTTP v1 ──► dispositivo
```

**Detección de plataforma**: `Capacitor.isNativePlatform()`. Todo código nativo queda detrás de esa verificación, así la web nunca carga ni ejecuta plugins nativos (los plugins tienen implementación web vacía/no-op).

### Encaje con MVVM del proyecto

```
lib/native/
  platform.ts            # isNative(), getPlatform()
  push.ts                # registro FCM, listeners
  file-share.ts          # guardar + compartir archivo
constants/native.constants.ts      # canales, ids, rutas deep link
types/notification.types.ts        # DeviceToken, NotificationPayload, NotificationPreferences
viewModels/usePushNotificationsViewModel.ts
viewModels/useNativeShellViewModel.ts       # back button, status bar, splash, network
viewModels/useBiometricLockViewModel.ts
viewModels/useNotificationPreferencesViewModel.ts
providers/NativeProvider.tsx                # monta los ViewModels nativos (client)
components/settings/NotificationSettingsSection.tsx
components/layout/OfflineBanner.tsx
components/layout/BiometricLockScreen.tsx
```

## 6. Requerimientos

### 6.1 Funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-01 | La app instala como APK, muestra icono adaptativo y splash con la marca Aurum | Alta |
| RF-02 | Toda la funcionalidad web (cuentas, gastos, presupuestos, metas, reportes, transferencias, recurrentes, ajustes) está disponible con el mismo diseño, modo claro/oscuro incluido | Alta |
| RF-03 | Login/registro con email y contraseña; la sesión persiste al cerrar y reabrir la app | Alta |
| RF-04 | Al iniciar sesión se pide permiso de notificaciones (Android 13+ `POST_NOTIFICATIONS`) y se registra el token FCM del dispositivo | Alta |
| RF-05 | **Push: presupuesto en advertencia/excedido** cuando se registra un gasto que cruza `alert_threshold` (respeta `notifications_enabled` del presupuesto) | Alta |
| RF-06 | **Push: gasto recurrente generado** cuando el servidor crea el movimiento | Alta |
| RF-07 | **Push: meta alcanzada** al llegar al 100% | Media |
| RF-08 | **Push: resumen / tipo de cambio diario** (opcional, desactivado por defecto) | Baja |
| RF-09 | **Recordatorio local** diario configurable ("¿Registraste tus gastos hoy?") | Media |
| RF-10 | Al tocar una notificación se abre la pantalla correspondiente (deep link interno: `/budgets`, `/recurring`, `/goals`) | Alta |
| RF-11 | Pantalla de preferencias de notificaciones en Ajustes (por tipo, on/off) | Alta |
| RF-12 | Botón atrás de Android: cierra modal abierto → navega atrás → en el dashboard sale de la app | Alta |
| RF-13 | Exportar CSV guarda el archivo y abre la hoja de compartir nativa | Media |
| RF-14 | Bloqueo con biometría opcional al abrir / volver de segundo plano | Media |
| RF-15 | Banner "Sin conexión" y página de error offline empaquetada si no hay red al abrir | Media |
| RF-16 | Háptica ligera al guardar/eliminar y en acciones principales | Baja |
| RF-17 | App Shortcuts (mantener presionado el icono): "Agregar gasto", "Agregar ingreso" | Baja |
| RF-18 | Links de confirmación de correo (`/callback`) abren la app (Android App Links) | Media |
| RF-19 | Cerrar sesión elimina el token FCM del dispositivo | Alta |

### 6.2 No funcionales

| ID | Requerimiento |
|---|---|
| RNF-01 | Cero regresiones en la web: el código nativo se ejecuta solo si `isNativePlatform()` |
| RNF-02 | Respeta reglas del repo: MVVM, constantes en `constants/`, tipos en `types/`, archivos ≤ ~150 líneas, kebab-case |
| RNF-03 | Seguridad: RLS en `device_tokens` y `notification_preferences`; la clave de servicio de Firebase solo vive en secretos de Supabase; el keystore de firma solo en secretos de GitHub |
| RNF-04 | Navegación restringida: el WebView solo permite el dominio de Aurum (`allowNavigation`); enlaces externos abren en el navegador del sistema |
| RNF-05 | Safe areas: contenido no queda bajo barra de estado ni barra de gestos (`env(safe-area-inset-*)`) |
| RNF-06 | Arranque en frío < 3 s en red 4G (splash cubre la carga) |
| RNF-07 | APK firmado y versionado (`versionCode` incremental por release) |
| RNF-08 | Compatibilidad Android 7.0+ (API 24) hasta la versión más reciente |

## 7. Afectaciones (cambios en el código existente)

| Archivo / área | Cambio | Riesgo |
|---|---|---|
| `package.json` | Dependencias de Capacitor y plugins; scripts `cap:sync`, `cap:open`, `android:build` | Bajo |
| **Nuevo** `capacitor.config.ts` | `appId: "com.aurum.finance"`, `server.url` (prod), `server.errorPath`, `allowNavigation`, config de SplashScreen/Push | Bajo |
| **Nuevo** `android/` | Proyecto nativo generado por `npx cap add android` (versionado en git, excepto builds) | Bajo |
| **Nuevo** `native-shell/` | `webDir` mínimo: `index.html` + `offline.html` empaquetados | Bajo |
| `tsconfig.json` | Excluir `android/` y `native-shell/` | Bajo |
| `app/layout.tsx` | Montar `NativeProvider`; `viewport.viewportFit = "cover"` | Bajo |
| `app/globals.css` | Utilidades de safe area (`pt-[env(safe-area-inset-top)]` etc.) | Medio (revisar en web) |
| `components/layout/Header.tsx`, `MobileNav.tsx`, `FloatingMenu.tsx` | Padding de safe area arriba/abajo | Medio |
| `components/ui/Modal.tsx` | Registrar/cerrar con botón atrás (pila de modales) | Medio |
| `lib/export.ts` | Rama nativa: `Filesystem.writeFile` + `Share.share`; web sin cambios | Bajo |
| `viewModels/useAuthViewModel.ts` | Tras login → registrar push; en logout → borrar token | Bajo |
| `viewModels/useBudgetAlertsViewModel.ts` | Se mantiene el toast in-app; el push lo envía el servidor (evitar duplicados con flag `last_alert_status`) | Medio |
| `store/slices/recurringSlice.ts` | `processRecurringThunk` deja de generar en cliente cuando existe el job de servidor (o queda como respaldo idempotente) | **Alto** — evitar doble inserción |
| `middleware.ts` | Excluir `/.well-known/` del matcher (App Links) | Bajo |
| **Nuevo** `public/.well-known/assetlinks.json` | Verificación de App Links con huella SHA-256 del keystore | Bajo |
| `next.config.ts` (PWA) | Mantener; validar que el service worker no sirva HTML viejo dentro del WebView tras un deploy | Medio |
| `app/manifest.ts` | Sin cambios funcionales | — |
| Supabase migraciones | `021_device_tokens.sql`, `022_notification_preferences.sql`, `023_server_recurring_processing.sql`, `024_push_triggers.sql` | Medio |
| **Nuevo** `supabase/functions/send-push/` | Edge Function FCM HTTP v1 | Medio |
| **Nuevo** `.github/workflows/android.yml` | Build + firma del APK como artefacto/release | Bajo |
| `gmail-addon/`, `app/api/*` | Sin cambios | — |

## 8. Modelo de datos nuevo

```sql
-- 021_device_tokens.sql
create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android','ios','web')),
  app_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.device_tokens enable row level security;
create policy "own tokens" on public.device_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 022_notification_preferences.sql
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  budget_alerts boolean not null default true,
  recurring_generated boolean not null default true,
  goal_reached boolean not null default true,
  daily_summary boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);
-- + RLS equivalente
```

- `budgets`: agregar `last_alert_status text` y `last_alert_period` para no enviar el mismo push varias veces en el mismo periodo.
- `023`: función SQL `process_due_recurring()` (misma lógica que `lib/recurrence.ts`) + `cron.schedule` diario en hora de Costa Rica.
- `024`: trigger `after insert on expenses` → `pg_net.http_post` a `send-push` con `{ user_id, type: 'budget_check' }`; la función calcula `get_budget_summary` y envía si cruza el umbral.

## 9. Flujo de notificaciones

1. Usuario inicia sesión en la app → `usePushNotificationsViewModel` pide permiso → `PushNotifications.register()` → recibe token FCM → `upsert` en `device_tokens`.
2. Evento en servidor (gasto insertado, cron de recurrentes, meta completada) → Edge Function `send-push` lee preferencias + tokens del usuario → envía a FCM con `data.route`.
3. Android muestra la notificación en el canal correspondiente (`budgets`, `recurring`, `goals`, `reminders`).
4. Tap → `pushNotificationActionPerformed` → `router.push(data.route)`.
5. Tokens inválidos (respuesta `UNREGISTERED` de FCM) se eliminan automáticamente.

## 10. Plan de trabajo por fases

| Fase | Entregable | Estimación |
|---|---|---|
| **0. Preparación** | Proyecto Firebase, `google-services.json`, keystore de firma, decidir `appId`, dominio prod fijo | 0.5 día |
| **1. Shell Capacitor** ✅ | `capacitor.config.ts`, `android/`, `native-shell/` offline, iconos/splash, status bar, APK debug que carga la web y permite login | 1–2 días |
| **2. Experiencia nativa** ✅ | Safe areas, botón atrás + modales, teclado, háptica, banner offline, enlaces externos, export CSV nativo | 2–3 días |
| **3. Backend de notificaciones** ✅ | Migraciones 021–024, Edge Function `send-push`, recurrentes en servidor (pg_cron), anti-duplicados | 3–4 días |
| **4. Push en cliente** ✅ | `usePushNotificationsViewModel`, canales, deep link al tocar, preferencias en Ajustes, recordatorio local | 2 días |
| **5. Extras nativos** 🟡 biometría y shortcuts listos; App Links pendiente del keystore | Biometría, App Shortcuts, App Links (`assetlinks.json`) | 2 días |
| **6. CI/CD y release** | Workflow GitHub Actions, APK firmado como release, versionado; (opcional) AAB para Play Store | 1 día |
| **7. QA** | Matriz de pruebas en dispositivos reales (Android 10, 13, 14+), modo oscuro, sin red, permisos negados | 1–2 días |

**Total estimado: ~13–17 días de desarrollo.** Cada fase = una rama `feat/android-<fase>` → PR → merge a `main` (según reglas del repo).

## 11. Pruebas / criterios de aceptación

- [ ] La web en Vercel se comporta idéntica (smoke test de todas las rutas en navegador desktop y móvil).
- [ ] APK instala, abre, inicia sesión, cierra y reabre sin pedir login.
- [ ] Notificación de presupuesto llega con la app cerrada y abre `/budgets` al tocarla; no se duplica.
- [ ] Recurrente vencido se genera aunque no se abra la app, una sola vez.
- [ ] Con permiso de notificaciones denegado la app funciona sin errores.
- [ ] Botón atrás cierra modales antes de navegar; en `/` sale de la app.
- [ ] Exportar CSV abre el diálogo de compartir con el archivo correcto.
- [ ] Sin red: banner visible; arranque sin red muestra `offline.html` con botón reintentar.
- [ ] Contenido no queda tapado por notch / barra de gestos en claro y oscuro.

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| App depende de internet (carga remota) | Página offline empaquetada; a futuro evaluar export estático (Opción C) si se requiere offline completo |
| Google Play puede rechazar "apps que solo envuelven una web" | Las funciones nativas (push, biometría, shortcuts, share) justifican la app; para APK directo no aplica |
| Doble generación de recurrentes (cliente + servidor) | Lógica idempotente con `next_date` actualizado en la misma transacción; desactivar el thunk cliente tras migrar |
| Service worker de la PWA sirviendo versión vieja en el WebView | `skipWaiting`/`clientsClaim`, o desactivar SW cuando `isNativePlatform()` |
| Pérdida del keystore impide actualizar la app | Respaldo cifrado del keystore + secretos en GitHub |
| Cambios de API en Capacitor/plugins | Fijar versiones exactas; revisar changelog antes de actualizar |
| Notificaciones molestas | Preferencias por tipo, horas de silencio, anti-duplicados por periodo |

## 13. Fuera de alcance (por ahora)

- iOS (Capacitor lo permite después con `npx cap add ios`; requiere cuenta Apple Developer y APNs).
- Widget de pantalla de inicio (requiere Kotlin nativo; candidato para una fase posterior: "gastado hoy / presupuesto restante").
- Modo offline completo con sincronización.
- Lectura automática de notificaciones/SMS bancarios.

## 14. Requisitos para empezar (del lado del dueño del proyecto)

1. Crear proyecto en **Firebase Console**, registrar app Android con el `appId` elegido y descargar `google-services.json`.
2. Generar **cuenta de servicio** de Firebase (JSON) → guardarla como secreto en Supabase (`FIREBASE_SERVICE_ACCOUNT`).
3. Habilitar extensiones **pg_cron** y **pg_net** en Supabase.
4. Generar **keystore** de firma y cargarlo en GitHub Secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).
5. Confirmar el **dominio de producción** definitivo (se fija en `server.url` y `assetlinks.json`).
6. (Opcional) Cuenta de Google Play Console si se publicará en la tienda.
