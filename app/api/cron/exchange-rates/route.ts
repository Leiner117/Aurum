import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";

const BCCR_VENTANILLA_URL =
  "https://gee.bccr.fi.cr/IndicadoresEconomicos/Cuadros/frmConsultaTCVentanilla.aspx";

async function fetchBacRates(): Promise<{ buyRate: number; sellRate: number }> {
  const response = await fetch(BCCR_VENTANILLA_URL, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AurumApp/1.0)" },
  });
  if (!response.ok) throw new Error(`BCCR fetch failed: ${response.status}`);

  const html = await response.text();

  // Row format: "Banco BAC San José S.A.   </td><td ...>445,00</td><td ...>459,00</td>"
  const bacMatch = html.match(
    /Banco BAC[^<]+<\/td><td[^>]+>([\d,.]+)<\/td><td[^>]+>([\d,.]+)/
  );
  if (!bacMatch) throw new Error("BAC row not found in BCCR ventanilla page");

  // BCCR uses comma as decimal separator: "445,00" → 445.0
  const parseRate = (s: string) => parseFloat(s.replace(",", "."));

  return {
    buyRate: parseRate(bacMatch[1]),
    sellRate: parseRate(bacMatch[2]),
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { buyRate, sellRate } = await fetchBacRates();

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
