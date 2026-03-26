import { SUPPORTED_CURRENCIES } from "@/constants/currency.constants";

export function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  return currency?.symbol ?? currencyCode;
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}
