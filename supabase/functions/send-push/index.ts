// Supabase Edge Function: delivers one queued notification to all of the user's devices.
// Called by the `dispatch_push_notification` DB trigger (pg_net) with { notification_id }.
// Deploy: supabase functions deploy send-push --no-verify-jwt
// Secrets: supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" PUSH_WEBHOOK_SECRET=...

import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendFcmMessage, type ServiceAccount } from "./fcm.ts";

// Android notification channels — must match constants/notifications.constants.ts
const CHANNEL_BY_TYPE: Record<string, string> = {
  budget_warning: "budgets",
  budget_exceeded: "budgets",
  recurring_generated: "recurring",
  goal_reached: "goals",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  if (req.headers.get("x-push-secret") !== Deno.env.get("PUSH_WEBHOOK_SECRET")) {
    return json(401, { error: "Unauthorized" });
  }

  const { notification_id: notificationId } = await req.json().catch(() => ({}));
  if (!notificationId) return json(400, { error: "notification_id is required" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: notification, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, route, data, push_status")
    .eq("id", notificationId)
    .single();

  if (error || !notification) return json(404, { error: "Notification not found" });
  if (notification.push_status !== "pending") return json(200, { skipped: notification.push_status });

  const markAs = (push_status: string, push_error: string | null = null) =>
    supabase
      .from("notifications")
      .update({ push_status, push_error, sent_at: push_status === "sent" ? new Date().toISOString() : null })
      .eq("id", notificationId);

  const { data: devices } = await supabase
    .from("device_tokens")
    .select("token")
    .eq("user_id", notification.user_id);

  if (!devices?.length) {
    await markAs("skipped", "No registered devices");
    return json(200, { sent: 0 });
  }

  const account = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}") as ServiceAccount;
  const data: Record<string, string> = {
    notification_id: notification.id,
    type: notification.type,
    route: notification.route ?? "/",
  };

  const results = await Promise.all(devices.map(async ({ token }) => {
    const result = await sendFcmMessage(account, {
      token,
      title: notification.title,
      body: notification.body,
      channelId: CHANNEL_BY_TYPE[notification.type] ?? "budgets",
      data,
    }).catch((err: Error) => ({ ok: false as const, unregistered: false, error: err.message }));

    if (!result.ok && result.unregistered) {
      await supabase.from("device_tokens").delete().eq("token", token);
    }
    return result;
  }));

  const sent = results.filter((r) => r.ok).length;
  const firstError = results.find((r) => !r.ok);
  await markAs(sent > 0 ? "sent" : "failed", firstError && !firstError.ok ? firstError.error : null);

  return json(200, { sent, failed: results.length - sent });
});
