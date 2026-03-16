import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
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
    .select("*, quote_leads(full_name, email, organization)")
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

  const lead = invite.quote_leads as { full_name: string; email: string; organization: string | null } | null;
  return NextResponse.json({
    full_name: lead?.full_name ?? "",
    email: lead?.email ?? "",
    organization: lead?.organization ?? null,
    custom_message: invite.custom_message ?? "",
    estimate: invite.estimate ?? "",
    meeting_link: invite.meeting_link ?? "",
  });
}
