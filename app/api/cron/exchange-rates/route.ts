import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";
import {
  BCCR_BANK_NAME_PATTERN,
  BCCR_CSRF_TOKEN_URL,
  BCCR_TIME_ZONE,
  BCCR_VENTANILLA_GROUP_ID,
  BCCR_VENTANILLA_URL,
} from "@/constants/currency.constants";

interface BccrCell {
  valorEspanol: string | null;
  valorIngles: string | null;
}

interface BccrCuadroResponse {
  estado: boolean;
  mensaje: string;
  datos: { indicadores: BccrCell[][] } | null;
}

// The BCCR API rejects anonymous calls without a short-lived CSRF token
async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(BCCR_CSRF_TOKEN_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`BCCR token fetch failed: ${response.status}`);
  return (await response.text()).replace(/"/g, "").trim();
}

// BCCR expects the query date as yyyy/MM/dd in Costa Rica time
function todayInCostaRica(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BCCR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts.replace(/-/g, "/");
}

// valorIngles uses "." as decimal separator ("451.00"); fall back to the Spanish "451,00"
function parseRate(cell: BccrCell | undefined): number {
  const raw = cell?.valorIngles ?? cell?.valorEspanol?.replace(",", ".") ?? "";
  const value = parseFloat(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid BCCR rate: "${raw}"`);
  return value;
}

async function fetchBacRates(): Promise<{ buyRate: number; sellRate: number }> {
  const token = await fetchCsrfToken();
  const url = `${BCCR_VENTANILLA_URL}?idGrupoVariable=${BCCR_VENTANILLA_GROUP_ID}&fechaAConsultar=${todayInCostaRica()}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Token_CSRF: token, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`BCCR fetch failed: ${response.status}`);

  const body = (await response.json()) as BccrCuadroResponse;
  if (!body.estado || !body.datos) throw new Error(`BCCR error: ${body.mensaje || "empty response"}`);

  // Each row: [entity, buy, sell, spread, last update]
  const bacRow = body.datos.indicadores.find((row) =>
    BCCR_BANK_NAME_PATTERN.test(row[0]?.valorEspanol ?? "")
  );
  if (!bacRow) throw new Error("BAC row not found in BCCR ventanilla table");

  return { buyRate: parseRate(bacRow[1]), sellRate: parseRate(bacRow[2]) };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rates: { buyRate: number; sellRate: number };
  try {
    rates = await fetchBacRates();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch BAC rates";
    console.error("[cron/exchange-rates]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const { buyRate, sellRate } = rates;

  const { error } = await supabaseAdmin
    .from(SUPABASE_TABLES.EXCHANGE_RATES)
    .upsert(
      {
        base_currency: "USD",
        target_currency: "CRC",
        rate: buyRate,
        sell_rate: sellRate,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "base_currency,target_currency" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, buyRate, sellRate });
}
