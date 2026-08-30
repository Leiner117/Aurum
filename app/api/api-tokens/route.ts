import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRawToken, hashToken } from "@/lib/api-tokens";
import { SUPABASE_TABLES } from "@/constants/supabase.constants";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from(SUPABASE_TABLES.API_TOKENS)
    .select("id, name, created_at, last_used_at, is_active")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 422 });
  }

  const rawToken = generateRawToken();
  const hashed = await hashToken(rawToken);

  const { data, error } = await supabase
    .from(SUPABASE_TABLES.API_TOKENS)
    .insert({ user_id: user.id, name: name.trim(), token: hashed })
    .select("id, name, created_at, last_used_at, is_active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data, rawToken }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 422 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from(SUPABASE_TABLES.API_TOKENS)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
