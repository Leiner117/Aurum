import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";

const BAC_XML_URL =
  "https://www.sucursalelectronica.com/exchangerate/showXmlExchangeRate.do";

async function fetchBacVentaRate(): Promise<number> {
  const response = await fetch(BAC_XML_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`BAC fetch failed: ${response.status}`);

  const xml = await response.text();

  const costaRicaBlock = xml.match(
    /<country>[\s\S]*?<name>Costa Rica<\/name>[\s\S]*?<\/country>/
  );
  if (!costaRicaBlock) throw new Error("Costa Rica block not found in BAC XML");

  const match = costaRicaBlock[0].match(/<buyRateUSD>([\d.]+)<\/buyRateUSD>/);
  if (!match) throw new Error("saleRateUSD not found in Costa Rica block");

  return parseFloat(match[1]);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ventaRate = await fetchBacVentaRate();

  const { error } = await supabaseAdmin
    .from(SUPABASE_TABLES.EXCHANGE_RATES)
    .upsert(
      {
        base_currency: "USD",
        target_currency: "CRC",
        rate: ventaRate,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "base_currency,target_currency" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rate: ventaRate });
}
