import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";

const BAC_XML_URL =
  "https://www.sucursalelectronica.com/exchangerate/showXmlExchangeRate.do";

async function fetchBacRates(): Promise<{ buyRate: number; sellRate: number }> {
  const response = await fetch(BAC_XML_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`BAC fetch failed: ${response.status}`);

  const xml = await response.text();

  const costaRicaBlock = xml.match(
    /<country>[\s\S]*?<name>Costa Rica<\/name>[\s\S]*?<\/country>/
  );
  if (!costaRicaBlock) throw new Error("Costa Rica block not found in BAC XML");

  const buyMatch = costaRicaBlock[0].match(/<buyRateUSD>([\d.]+)<\/buyRateUSD>/);
  if (!buyMatch) throw new Error("buyRateUSD (compra) not found in Costa Rica block");

  const sellMatch = costaRicaBlock[0].match(/<saleRateUSD>([\d.]+)<\/saleRateUSD>/);
  if (!sellMatch) throw new Error("saleRateUSD (venta) not found in Costa Rica block");

  return {
    buyRate: parseFloat(buyMatch[1]),
    sellRate: parseFloat(sellMatch[1]),
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
