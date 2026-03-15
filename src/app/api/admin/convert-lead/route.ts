import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DEFAULT_CLIENT_PASSWORD = "Welcome123!";

export async function POST(request: Request) {
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

    const { leadId, password } = await request.json();
    if (!leadId) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }

    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: lead, error: leadError } = await serviceSupabase
      .from("quote_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead || lead.status === "converted") {
      return NextResponse.json(
        { error: "Lead not found or already converted" },
        { status: 400 }
      );
    }

    const { data: existingUser } = await serviceSupabase.auth.admin.listUsers();
    const alreadyExists = existingUser?.users?.some(
      (u) => u.email?.toLowerCase() === lead.email.toLowerCase()
    );
    if (alreadyExists) {
      return NextResponse.json(
        { error: "A client with this email already exists" },
        { status: 400 }
      );
    }

    const clientPassword = password?.trim() || DEFAULT_CLIENT_PASSWORD;

    const { data: newUser, error: createError } =
      await serviceSupabase.auth.admin.createUser({
        email: lead.email,
        password: clientPassword,
        email_confirm: true,
        user_metadata: {
          full_name: lead.full_name,
          company_name: lead.organization,
        },
      });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    await serviceSupabase
      .from("profiles")
      .update({
        role: "client",
        full_name: lead.full_name,
        company_name: lead.organization || null,
      })
      .eq("id", newUser.user.id);

    await serviceSupabase
      .from("quote_leads")
      .update({
        status: "converted",
        converted_client_id: newUser.user.id,
      })
      .eq("id", leadId);

    return NextResponse.json({
      success: true,
      clientId: newUser.user.id,
      email: lead.email,
      tempPassword: clientPassword,
    });
  } catch (err) {
    console.error("Convert lead error:", err);
    return NextResponse.json(
      { error: "Failed to convert lead" },
      { status: 500 }
    );
  }
}
