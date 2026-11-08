"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { useSecuritySettingsViewModel } from "@/viewModels/useSecuritySettingsViewModel";

// App-only: lock Aurum with fingerprint, face or the device PIN
export const SecuritySettingsSection = () => {
  const { isNative, isAvailable, isLockEnabled, toggleLock } = useSecuritySettingsViewModel();

  if (!isNative) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Security</h2>
      </CardHeader>
      <CardBody>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">App lock</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {isAvailable
                ? "Require fingerprint, face or your device PIN to open Aurum"
                : "Set up a screen lock or fingerprint on this device to use app lock"}
            </p>
          </div>
          <Switch label="App lock" checked={isLockEnabled} disabled={!isAvailable} onChange={() => toggleLock()} />
        </div>
      </CardBody>
    </Card>
  );
};
