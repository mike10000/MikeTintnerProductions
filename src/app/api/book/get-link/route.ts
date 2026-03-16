import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { sendInviteEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    if (!email?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Name and email required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: existingLead } = await supabase
      .from("quote_leads")
      .select("id")
      .ilike("email", email.trim())
      .limit(1)
      .single();

    let leadId: string;

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      const { data: newLead, error: insertError } = await supabase
        .from("quote_leads")
        .insert({
          full_name: name.trim(),
          email: email.trim(),
          message: "Booking request from /book page",
        })
        .select("id")
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 400 }
        );
      }
      leadId = newLead!.id;
    }

    const token = randomBytes(32).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const inviteUrl = `${baseUrl}/invite/${token}`;

    await supabase.from("lead_invites").insert({
      lead_id: leadId,
      token,
      custom_message: "Pick a time for your free consultation below, then approve to get portal access.",
      created_by: null,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await supabase
      .from("quote_leads")
      .update({ status: "invited" })
      .eq("id", leadId);

    await sendInviteEmail({
      to: email.trim(),
      leadName: name.trim(),
      customMessage: "Pick a time for your free consultation using the link below. After you select a time, you'll get portal access.",
      estimate: "",
      meetingLink: "",
      inviteUrl,
      loginEmail: email.trim(),
      temporaryPassword: "Welcome123!",
    });

    return NextResponse.json({ inviteUrl });
  } catch (err) {
    console.error("Book get-link error:", err);
    return NextResponse.json(
      { error: "Failed to create booking link" },
      { status: 500 }
    );
  }
}
