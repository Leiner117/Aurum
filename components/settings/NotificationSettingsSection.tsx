"use client";

import { BellOff, BellRing } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/providers/ToastProvider";
import { useNotificationSettingsViewModel } from "@/viewModels/useNotificationSettingsViewModel";
import { NOTIFICATION_PREFERENCE_OPTIONS } from "@/constants/notifications.constants";

const pad = (value: number) => String(value).padStart(2, "0");

const Row = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-[var(--color-foreground)]">{title}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{description}</p>
    </div>
    {children}
  </div>
);

export const NotificationSettingsSection = () => {
  const { showToast } = useToast();
  const { isNative, isLoading, preferences, permission, reminder, togglePreference, enablePush, updateReminder } =
    useNotificationSettingsViewModel();

  const handleToggle = async (key: (typeof NOTIFICATION_PREFERENCE_OPTIONS)[number]["key"]) => {
    if (!(await togglePreference(key))) showToast("Failed to update notification settings", "error");
  };

  const handleEnablePush = async () => {
    const result = await enablePush();
    if (result === "denied") showToast("Notifications are blocked. Enable them in Android Settings → Apps → Aurum.", "warning");
  };

  const handleReminder = async (next: typeof reminder) => {
    if (!(await updateReminder(next))) showToast("Failed to schedule the reminder", "error");
  };

  const handleTime = (value: string) => {
    const [hour, minute] = value.split(":").map(Number);
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) handleReminder({ ...reminder, hour, minute });
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Notifications</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {isNative && permission !== "granted" && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3">
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <BellOff className="h-4 w-4 shrink-0" />
              Push notifications are off on this device.
            </div>
            <Button size="sm" onClick={handleEnablePush}>
              <BellRing className="h-4 w-4" />
              Enable
            </Button>
          </div>
        )}

        {!isNative && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Push notifications are delivered to the Aurum Android app. These choices apply to all your devices.
          </p>
        )}

        {NOTIFICATION_PREFERENCE_OPTIONS.map((option) => (
          <Row key={option.key} title={option.label} description={option.description}>
            <Switch
              label={option.label}
              checked={preferences[option.key]}
              disabled={isLoading}
              onChange={() => handleToggle(option.key)}
            />
          </Row>
        ))}

        {isNative && (
          <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
            <Row title="Daily reminder" description="A nudge on this device to log your transactions">
              <Switch
                label="Daily reminder"
                checked={reminder.enabled}
                onChange={(enabled) => handleReminder({ ...reminder, enabled })}
              />
            </Row>
            {reminder.enabled && (
              <input
                type="time"
                aria-label="Reminder time"
                value={`${pad(reminder.hour)}:${pad(reminder.minute)}`}
                onChange={(e) => handleTime(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
              />
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
