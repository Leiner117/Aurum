# Aurum — Notificaciones push: despliegue del backend (Fase 3)

Flujo: un evento en la base de datos → fila en `public.notifications` → trigger con `pg_net`
→ Edge Function `send-push` → Firebase Cloud Messaging → teléfono.

| Evento | Dónde se genera | Tipo | Pantalla al tocar |
|---|---|---|---|
| Presupuesto llega al umbral / se excede | trigger `trg_expense_budget_alerts` en `expenses` | `budget_warning` / `budget_exceeded` | `/budgets` |
| Recurrentes creados por el job diario | `process_recurring_internal(null, true)` vía `pg_cron` | `recurring_generated` | `/recurring` |
| Meta completada | trigger `trg_goal_reached` en `goals` | `goal_reached` | `/goals` |

Reglas:
- Una alerta por umbral y por periodo (`budgets.last_alert_status`). Si el gasto baja (se borra o se mueve un gasto), la alerta vuelve a quedar armada.
- Respeta `budgets.notifications_enabled` y `notification_preferences`. Si una preferencia está apagada, la fila queda como `skipped` y no se envía.
- Si los secretos aún no están configurados, las notificaciones se guardan como historial y no se envían. Nada se rompe.
- Los fallos del trigger nunca bloquean el guardado de un gasto o una meta.

## Migraciones
`021_device_tokens` · `022_notifications` · `023_server_recurring_processing` · `024_push_triggers` · `025_harden_push_functions`

> ✅ Aplicadas en producción (`majazwbtqgrdhlfelftq`) el 2026-11-08. Respaldo previo en el schema `backup_20261108`.

> ⚠️ Desde la `023`, la app ya **no** genera los recurrentes en el navegador: llama a `process_my_recurring()`.
> Hay que aplicar las migraciones **antes** de desplegar el frontend de esta rama.

## Pasos (una sola vez)

1. **Extensiones**: en Dashboard → Database → Extensions, habilitar `pg_cron` y `pg_net` (las migraciones también lo intentan).
2. **Aplicar migraciones**: `supabase db push` (o pegarlas en orden en el SQL editor).
3. **Firebase**:
   - Console → crear proyecto → *Add app* → Android con package `com.aurum.finance`.
   - Descargar `google-services.json` (se usa en la Fase 4, en la app).
   - Project settings → *Service accounts* → *Generate new private key* → `service-account.json`.
4. **Secretos de la Edge Function**:
   ```bash
   PUSH_SECRET=$(openssl rand -hex 32)
   supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" PUSH_WEBHOOK_SECRET="$PUSH_SECRET"
   supabase functions deploy send-push --no-verify-jwt
   ```
   (`--no-verify-jwt` porque la llama la base de datos; se autentica con el header `x-push-secret`.)
5. **Secretos en Vault** (SQL editor), usando el mismo valor de `PUSH_SECRET`:
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<PUSH_SECRET>', 'push_webhook_secret');
   ```
6. **Verificar**:
   ```sql
   select * from cron.job where jobname = 'process-recurring-daily';   -- 06:05 hora CR
   select type, push_status, push_error, created_at from notifications order by created_at desc limit 10;
   select status_code, content from net._http_response order by created desc limit 5;
   ```

## Estados de `notifications.push_status`
| Estado | Significado |
|---|---|
| `pending` | Encolada; la Edge Function no la ha procesado (o faltan secretos en Vault) |
| `sent` | Entregada a FCM en al menos un dispositivo |
| `skipped` | Preferencia apagada o el usuario no tiene dispositivos registrados |
| `failed` | FCM rechazó todos los envíos (ver `push_error`) |

Los tokens que FCM reporta como inválidos (app desinstalada) se borran solos de `device_tokens`.

## Nota sobre la migración 015
Al aplicar las migraciones desde cero, la `015` falla con *"cannot change return type of existing function"*:
le falta un `drop function public.get_budget_summary(uuid, smallint, smallint)` antes del `create`.
Producción ya la tiene aplicada, así que no afecta. Solo importa al recrear la base local.
