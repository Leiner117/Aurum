import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";

const HACIENDA_TC_URL = "https://api.hacienda.go.cr/indicadores/tc";

async function fetchHaciendaRates(): Promise<{ buyRate: number; sellRate: number }> {
  const response = await fetch(HACIENDA_TC_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Hacienda fetch failed: ${response.status}`);

  const data = await response.json();

  const buyRate = data?.dolar?.compra?.valor;
  const sellRate = data?.dolar?.venta?.valor;

  if (typeof buyRate !== "number" || typeof sellRate !== "number") {
    throw new Error("Unexpected response structure from Hacienda API");
  }

  return { buyRate, sellRate };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { buyRate, sellRate } = await fetchHaciendaRates();

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
