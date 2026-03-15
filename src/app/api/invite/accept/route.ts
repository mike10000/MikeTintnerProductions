import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_PASSWORD = "Welcome123!";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: invite, error: inviteError } = await supabase
      .from("lead_invites")
      .select("*, quote_leads(*)")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    const lead = invite.quote_leads as {
      id: string;
      full_name: string;
      email: string;
      organization: string | null;
    };

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === lead.email.toLowerCase()
    );
    if (alreadyExists) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    const clientPassword = password?.trim() || DEFAULT_PASSWORD;

    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
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

    await supabase
      .from("profiles")
      .update({
        role: "client",
        full_name: lead.full_name,
        company_name: lead.organization || null,
      })
      .eq("id", newUser.user.id);

    await supabase
      .from("lead_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    await supabase
      .from("quote_leads")
      .update({
        status: "converted",
        converted_client_id: newUser.user.id,
      })
      .eq("id", lead.id);

    return NextResponse.json({
      success: true,
      email: lead.email,
      message: "Account created. You can now log in to the client portal.",
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
