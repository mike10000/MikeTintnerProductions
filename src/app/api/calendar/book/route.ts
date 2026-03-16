import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createCalendarEvent, isCalendarConfigured } from "@/lib/google-calendar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, slotStart, slotEnd, attendeeName } = body;

    if (!token || !slotStart || !slotEnd) {
      return NextResponse.json(
        { error: "Token, slotStart, and slotEnd required" },
        { status: 400 }
      );
    }

    if (!isCalendarConfigured()) {
      return NextResponse.json(
        { error: "Calendar scheduling is not configured" },
        { status: 400 }
      );
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

    if (inviteError || !invite || invite.accepted_at) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    const lead = invite.quote_leads as {
      full_name: string;
      email: string;
    };

    const result = await createCalendarEvent({
      summary: `Free consultation — ${lead.full_name}`,
      description: `Consultation with ${lead.full_name} (${lead.email})`,
      start: slotStart,
      end: slotEnd,
      attendeeEmail: lead.email,
      createMeetLink: true,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    if (result.meetLink) {
      await supabase
        .from("lead_invites")
        .update({ meeting_link: result.meetLink })
        .eq("id", invite.id);
    }

    return NextResponse.json({
      success: true,
      meetLink: result.meetLink,
      eventLink: result.eventLink,
    });
  } catch (err) {
    console.error("Calendar book error:", err);
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}
