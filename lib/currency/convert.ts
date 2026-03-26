import { EXCHANGE_RATE_CACHE_HOURS } from "@/constants/currency.constants";

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

let cachedRates: ExchangeRates | null = null;

export async function fetchExchangeRates(
  baseCurrency: string
): Promise<Record<string, number>> {
  const now = Date.now();
  const cacheMs = EXCHANGE_RATE_CACHE_HOURS * 60 * 60 * 1000;

  if (
    cachedRates &&
    cachedRates.base === baseCurrency &&
    now - cachedRates.fetchedAt < cacheMs
  ) {
    return cachedRates.rates;
  }

  const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch exchange rates");

  const data = await response.json();
  cachedRates = {
    base: baseCurrency,
    rates: data.conversion_rates,
    fetchedAt: now,
  };

  return cachedRates.rates;
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = rates[toCurrency] / rates[fromCurrency];
  return amount * rate;
}
