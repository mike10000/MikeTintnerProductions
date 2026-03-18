import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    if (!clientId) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }

    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const [profileRes, authRes] = await Promise.all([
      serviceSupabase
        .from("profiles")
        .select("id, full_name, company_name, phone, role, created_at")
        .eq("id", clientId)
        .single(),
      serviceSupabase.auth.admin.getUserById(clientId),
    ]);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const authUser = (authRes.data as { user?: { email?: string } })?.user;
    const email = authUser?.email ?? null;

    return NextResponse.json({
      id: profileRes.data.id,
      full_name: profileRes.data.full_name,
      company_name: profileRes.data.company_name,
      phone: profileRes.data.phone,
      email,
      role: profileRes.data.role,
      created_at: profileRes.data.created_at,
    });
  } catch (err) {
    console.error("Client info error:", err);
    return NextResponse.json(
      { error: "Failed to fetch client info" },
      { status: 500 }
    );
  }
}
