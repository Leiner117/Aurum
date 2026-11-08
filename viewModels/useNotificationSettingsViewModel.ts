"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useIsNative } from "@/lib/native/use-is-native";
import { readStorage, writeStorage } from "@/lib/native/storage";
import { getPushPermission, registerForPush, requestPushPermission, type PushPermission } from "@/lib/native/push";
import { cancelDailyReminder, scheduleDailyReminder } from "@/lib/native/reminders";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import {
  DAILY_REMINDER_DEFAULT,
  DAILY_REMINDER_STORAGE_KEY,
  NOTIFICATION_PREFERENCE_DEFAULTS,
} from "@/constants/notifications.constants";
import type { NotificationPreferences } from "@/types/notification.types";

export type NotificationPreferenceKey = keyof typeof NOTIFICATION_PREFERENCE_DEFAULTS;
export type PreferenceValues = Record<NotificationPreferenceKey, boolean>;

export interface DailyReminder {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface NotificationSettingsViewModelReturn {
  isNative: boolean;
  isLoading: boolean;
  preferences: PreferenceValues;
  permission: PushPermission;
  reminder: DailyReminder;
  togglePreference: (key: NotificationPreferenceKey) => Promise<boolean>;
  enablePush: () => Promise<PushPermission>;
  updateReminder: (next: DailyReminder) => Promise<boolean>;
}

export const useNotificationSettingsViewModel = (): NotificationSettingsViewModelReturn => {
  const isNative = useIsNative();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<PreferenceValues>({ ...NOTIFICATION_PREFERENCE_DEFAULTS });
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const [reminder, setReminder] = useState<DailyReminder>({ ...DAILY_REMINDER_DEFAULT });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from(SUPABASE_TABLES.NOTIFICATION_PREFERENCES)
        .select("budget_alerts, recurring_generated, goal_reached")
        .maybeSingle();
      if (data) setPreferences(data as Pick<NotificationPreferences, NotificationPreferenceKey>);
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!isNative) return;
    getPushPermission().then(setPermission);
    setReminder(readStorage<DailyReminder>(DAILY_REMINDER_STORAGE_KEY, { ...DAILY_REMINDER_DEFAULT }));
  }, [isNative]);

  const togglePreference = useCallback(async (key: NotificationPreferenceKey) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    const { error } = await supabase
      .from(SUPABASE_TABLES.NOTIFICATION_PREFERENCES)
      .upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() });
    if (error) setPreferences(preferences);
    return !error;
  }, [preferences]);

  const enablePush = useCallback(async () => {
    const result = await requestPushPermission();
    setPermission(result);
    if (result === "granted") registerForPush();
    return result;
  }, []);

  const updateReminder = useCallback(async (next: DailyReminder) => {
    try {
      if (next.enabled) await scheduleDailyReminder(next.hour, next.minute);
      else await cancelDailyReminder();
      setReminder(next);
      writeStorage(DAILY_REMINDER_STORAGE_KEY, next);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isNative, isLoading, preferences, permission, reminder, togglePreference, enablePush, updateReminder };
};
