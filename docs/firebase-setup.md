# Aurum — Configurar Firebase (notificaciones push)

Firebase solo se usa como **mensajero** (Firebase Cloud Messaging). La base de datos y el login siguen en Supabase.
Tiempo estimado: 15–20 minutos.

Al terminar tendrás:
- `google-services.json` → va dentro de la app Android.
- `service-account.json` → llave privada que usa Supabase para enviar. **Muy sensible: nunca la subas al repo.**

---

## Parte A — Firebase Console

### 1. Crear el proyecto
1. Entra a <https://console.firebase.google.com> con tu cuenta de Google.
2. **Create a project** (Crear proyecto) → nombre: `Aurum`.
3. Google Analytics: **desactívalo**; no hace falta para notificaciones.
4. **Create project** y espera a que termine.

### 2. Registrar la app Android
1. En la página del proyecto, haz clic en el icono de **Android** (o *Add app → Android*).
2. **Android package name**: `com.aurum.finance`
   > Tiene que ser **exactamente** este valor (es el `appId` de `capacitor.config.ts`). Si no coincide, las notificaciones no llegan.
3. **App nickname**: `Aurum Android` (opcional).
4. **Debug signing certificate SHA-1**: déjalo vacío; FCM no lo necesita.
5. **Register app**.
6. **Download google-services.json** y guárdalo.
7. Los pasos siguientes del asistente ("Add Firebase SDK", etc.) **sáltalos** con *Next* → *Continue to console*. Capacitor ya incluye el SDK.

### 3. Verificar que la API de mensajería esté activa
1. ⚙️ **Project settings** → pestaña **Cloud Messaging**.
2. En *Firebase Cloud Messaging API (V1)* debe decir **Enabled**.
   - Si dice *Disabled*: abre el menú ⋮ → *Manage API in Google Cloud Console* → **Enable**.
3. Ignora la *Cloud Messaging API (Legacy)*; está obsoleta y no se usa.

### 4. Generar la llave de la cuenta de servicio
1. ⚙️ **Project settings** → pestaña **Service accounts**.
2. **Generate new private key** → **Generate key**.
3. Se descarga un JSON (por ejemplo `aurum-xxxxx-firebase-adminsdk-xxxxx.json`). Renómbralo a `service-account.json`.
4. Guárdalo en un lugar seguro, como un gestor de contraseñas. Si se filtra, revócalo en esa misma pantalla (Google Cloud → IAM → Service accounts → Keys).

---

## Parte B — La app Android

### 5. Colocar `google-services.json`
**Local** (para compilar en tu PC):
```bash
cp ~/Downloads/google-services.json android/app/google-services.json
```
Ya está en `.gitignore`, así que no se sube al repo.

**GitHub Actions** (para que CI compile con push):
1. Repo → *Settings → Secrets and variables → Actions → New repository secret*.
2. Nombre: `GOOGLE_SERVICES_JSON` → valor: pega **todo el contenido** del archivo.

Comprueba que el `package_name` sea correcto:
```bash
grep package_name android/app/google-services.json   # → "com.aurum.finance"
```

---

## Parte C — Supabase (backend que envía)

> Requiere la [Supabase CLI](https://supabase.com/docs/guides/cli). Se puede usar sin instalar con `npx supabase ...`.

### 6. Vincular el proyecto
```bash
npx supabase login
npx supabase link --project-ref <project-ref>   # el id de la URL: https://<project-ref>.supabase.co
```

### 7. Aplicar las migraciones 021–024
1. Dashboard → *Database → Extensions* → habilita **pg_cron** y **pg_net**.
2. Aplica las migraciones:
   - **Si siempre aplicaste las migraciones pegándolas en el SQL editor**: haz lo mismo con
     `021_device_tokens.sql`, `022_notifications.sql`, `023_server_recurring_processing.sql` y `024_push_triggers.sql`,
     **en ese orden**.
     > ⚠️ En ese caso **no** uses `supabase db push`: intentaría reaplicar desde la 001.
   - **Si usas `supabase db push` normalmente**: `npx supabase db push`.

### 8. Guardar los secretos y desplegar la función
```bash
# Secreto compartido entre la base de datos y la función (guárdalo, lo usas en el paso 9)
PUSH_SECRET=$(openssl rand -hex 32); echo "$PUSH_SECRET"

npx supabase secrets set \
  FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" \
  PUSH_WEBHOOK_SECRET="$PUSH_SECRET"

npx supabase functions deploy send-push --no-verify-jwt
```
`--no-verify-jwt` es correcto: la función la llama la base de datos y se autentica con el header `x-push-secret`.

### 9. Secretos en Vault (SQL editor)
```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<el mismo PUSH_SECRET del paso 8>', 'push_webhook_secret');
```

### 10. Borrar la llave local
Cuando el paso 8 haya funcionado:
```bash
rm service-account.json
```
La copia queda en tu gestor de contraseñas y en los secretos de Supabase.

---

## Parte D — Probar

1. Compila e instala la app:
   ```bash
   npm run android:build
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
2. Abre la app, inicia sesión y **acepta** el permiso de notificaciones.
3. Comprueba que el teléfono quedó registrado (SQL editor):
   ```sql
   select user_id, platform, app_version, last_seen_at from public.device_tokens;
   ```
4. Cierra la app (ve al inicio del teléfono) y envía una prueba:
   ```sql
   select public.enqueue_notification(
     (select user_id from public.device_tokens limit 1),
     'goal_reached', 'Prueba', 'Hola desde Aurum 👋', '/goals'
   );
   ```
5. Revisa el resultado:
   ```sql
   select type, push_status, push_error, created_at
   from public.notifications order by created_at desc limit 5;
   ```

## Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `device_tokens` vacío | Falta `google-services.json` al compilar, o se negó el permiso | Recompila con el archivo; *Settings → Notifications → Enable* en la app |
| `push_status = pending` y no cambia | Faltan los secretos de Vault, o la función no está desplegada | Paso 9; `select * from net._http_response order by created desc limit 5;` |
| `push_status = failed`, error `401`/`403` de Google | `FIREBASE_SERVICE_ACCOUNT` mal copiado, o la API V1 está desactivada | Repite el paso 8 con el JSON completo; paso 3 |
| `push_status = failed`, `SENDER_ID_MISMATCH` | `google-services.json` y la cuenta de servicio son de proyectos distintos | Descarga ambos del mismo proyecto Firebase |
| `push_status = skipped`, *No registered devices* | El usuario no tiene la app registrada | Paso D.2–3 |
| Respuesta `401 Unauthorized` en `net._http_response` | `PUSH_WEBHOOK_SECRET` distinto en Vault y en la función | Usa el mismo valor en los pasos 8 y 9 |
| Llega, pero no suena o no aparece arriba | El canal está silenciado en Android | Ajustes del teléfono → Apps → Aurum → Notificaciones |

Logs de la función: Dashboard → *Edge Functions → send-push → Logs*.
