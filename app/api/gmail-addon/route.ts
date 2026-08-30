import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/api-tokens";
import { expenseSchema } from "@/lib/validators";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const raw = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hashed = await hashToken(raw);

  const { data: tokenRow } = await supabaseAdmin
    .from(SUPABASE_TABLES.API_TOKENS)
    .select("id, user_id")
    .eq("token", hashed)
    .eq("is_active", true)
    .single();

  if (!tokenRow) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  supabaseAdmin
    .from(SUPABASE_TABLES.API_TOKENS)
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenRow.id)
    .then(() => {});

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from(SUPABASE_TABLES.EXPENSES)
    .insert({ ...parsed.data, user_id: tokenRow.user_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
