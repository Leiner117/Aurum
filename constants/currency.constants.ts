export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "CRC", symbol: "₡", name: "Costa Rican Colón" },
] as const;

export const DEFAULT_CURRENCY = "USD";

export const EXCHANGE_RATE_CACHE_HOURS = 6;
