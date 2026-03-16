import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { sendInviteEmail } from "@/lib/email";

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

    const { leadId, customMessage, estimate, meetingLink } = await request.json();
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

    const token = randomBytes(32).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${token}`;

    const { data: invite, error: insertError } = await serviceSupabase
      .from("lead_invites")
      .insert({
        lead_id: leadId,
        token,
        custom_message: customMessage?.trim() || null,
        estimate: estimate?.trim() || null,
        meeting_link: meetingLink?.trim() || null,
        created_by: user.id,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    await serviceSupabase
      .from("quote_leads")
      .update({ status: "invited" })
      .eq("id", leadId);

    // Send email via Gmail SMTP if configured
    const emailResult = await sendInviteEmail({
      to: lead.email,
      leadName: lead.full_name,
      customMessage: customMessage?.trim() || undefined,
      estimate: estimate?.trim() || "",
      meetingLink: meetingLink?.trim() || "",
      inviteUrl,
      loginEmail: lead.email,
      temporaryPassword: "Welcome123!",
    });

    return NextResponse.json({
      success: true,
      inviteUrl,
      token,
      emailSent: emailResult.sent,
      emailError: emailResult.sent ? undefined : emailResult.error,
    });
  } catch (err) {
    console.error("Create invite error:", err);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
