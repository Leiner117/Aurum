"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MonthlyIncomeModal } from "@/components/budgets/MonthlyIncomeModal";
import { useCurrencyViewModel } from "@/viewModels/useCurrencyViewModel";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuthViewModel } from "@/viewModels/useAuthViewModel";
import { useBudgetsViewModel } from "@/viewModels/useBudgetsViewModel";
import { useToast } from "@/providers/ToastProvider";
import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";
import { formatCurrency } from "@/lib/currency/format";
import { Sun, Moon, Monitor, LogOut, Pencil } from "lucide-react";
import type { MonthlyIncomeInput } from "@/lib/validators";

const THEME_OPTIONS = [
  { label: "Light", value: "light", icon: <Sun className="h-4 w-4" /> },
  { label: "Dark", value: "dark", icon: <Moon className="h-4 w-4" /> },
  { label: "System", value: "system", icon: <Monitor className="h-4 w-4" /> },
] as const;

const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
  label: `${c.code} — ${c.name} (${c.symbol})`,
  value: c.code,
}));

const SettingsPage = () => {
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const { defaultCurrency, setDefaultCurrency } = useCurrencyViewModel();
  const { theme, setTheme } = useTheme();
  const { logout, isLoading } = useAuthViewModel();
  const { monthlyIncome, isIncomeLoading, setMonthlyIncome, overview } = useBudgetsViewModel();
  const { showToast } = useToast();

  const handleCurrencyChange = async (currency: string) => {
    const ok = await setDefaultCurrency(currency);
    if (ok) showToast(`Default currency set to ${currency}`, "success");
    else showToast("Failed to update currency", "error");
  };

  const handleSetIncome = async (data: MonthlyIncomeInput) => {
    const ok = await setMonthlyIncome(data.monthly_income);
    if (ok) {
      setIsIncomeOpen(false);
      showToast("Monthly income updated", "success");
    } else {
      showToast("Failed to update income", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Settings" description="Manage your preferences." />

      {/* Monthly income */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Monthly Income
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {monthlyIncome !== null
                ? formatCurrency(monthlyIncome, overview.currency)
                : "Not set — used to calculate savings and budget compliance."}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsIncomeOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              {monthlyIncome !== null ? "Edit" : "Set"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Default Currency
          </h2>
        </CardHeader>
        <CardBody>
          <Select
            label="Currency used for budgets and reports"
            options={currencyOptions}
            value={defaultCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Appearance
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                  theme === opt.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-danger)]">
            Account
          </h2>
        </CardHeader>
        <CardBody>
          <Button
            variant="danger"
            size="sm"
            onClick={logout}
            isLoading={isLoading}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardBody>
      </Card>
      <MonthlyIncomeModal
        isOpen={isIncomeOpen}
        currentIncome={monthlyIncome}
        currency={overview.currency}
        isLoading={isIncomeLoading}
        onSubmit={handleSetIncome}
        onClose={() => setIsIncomeOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;
