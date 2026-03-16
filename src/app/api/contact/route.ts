import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendContactConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body?.name?.trim();
    const email = body?.email?.trim();
    const message = body?.message?.trim();
    const organization = body?.organization?.trim() || null;
    const type = body?.type?.trim() || null;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Contact form: Missing Supabase env vars");
      return NextResponse.json(
        { error: "Server configuration error. Please try again or email us directly." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase.from("quote_leads").insert({
      full_name: name,
      email,
      organization,
      org_type: type,
      message,
    });

    if (error) {
      console.error("Contact form insert error:", error.message, error.code);
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "Form is being set up. Please email us directly at info@MikeTintnerProductions.com in the meantime." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Failed to submit. Please try again or email us directly at info@MikeTintnerProductions.com." },
        { status: 500 }
      );
    }

    // Send confirmation email (optional - won't block success if SMTP fails)
    await sendContactConfirmationEmail({ to: email, name });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email us at info@MikeTintnerProductions.com." },
      { status: 500 }
    );
  }
}
