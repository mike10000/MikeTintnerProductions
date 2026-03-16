import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTransporter, isSmtpConfigured } from "@/lib/email";

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

    const { to } = await request.json().catch(() => ({}));
    const testTo = to || user.email;

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { error: "SMTP not configured. Add SMTP_USER and SMTP_APP_PASSWORD to .env.local" },
        { status: 400 }
      );
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Mike Tintner Productions" <${process.env.SMTP_USER!.trim()}>`,
      to: testTo,
      subject: "Gmail SMTP Test — Mike Tintner Productions",
      text: "If you received this email, Gmail SMTP is configured correctly. Invite emails and signed contract copies will be sent from this address.",
      html: "<p>If you received this email, Gmail SMTP is configured correctly. Invite emails and signed contract copies will be sent from this address.</p>",
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testTo}. Check your inbox.`,
    });
  } catch (err) {
    console.error("Test email error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to send: ${message}` },
      { status: 500 }
    );
  }
}
