import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNotificationEmail } from "@/lib/email";

const PREF_MAP: Record<string, keyof {
  work_order_updates: boolean;
  quote_updates: boolean;
  invoice_updates: boolean;
  task_updates: boolean;
  new_messages: boolean;
  contract_updates: boolean;
}> = {
  work_order_update: "work_order_updates",
  quote_sent: "quote_updates",
  invoice_sent: "invoice_updates",
  task_update: "task_updates",
  new_message: "new_messages",
  contract_ready: "contract_updates",
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.NOTIFICATION_CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, link_url")
    .eq("email_sent", false)
    .limit(50);

  if (!notifications?.length) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  for (const n of notifications) {
    // Welcome emails always send (no opt-out)
    const isWelcome = n.type === "welcome_client";
    let emailEnabled = isWelcome;

    if (!isWelcome) {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", n.user_id)
        .single();

      const prefKey = PREF_MAP[n.type];
      emailEnabled = prefs ? prefs[prefKey] !== false : true;
    }

    if (!emailEnabled) {
      await supabase.from("notifications").update({ email_sent: true }).eq("id", n.id);
      processed++;
      continue;
    }

    const { data } = await supabase.auth.admin.getUserById(n.user_id);
    const email = (data as { user?: { email?: string } })?.user?.email ?? (data as { email?: string })?.email;
    if (!email) {
      await supabase.from("notifications").update({ email_sent: true }).eq("id", n.id);
      processed++;
      continue;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("id", n.user_id)
      .single();

    const clientName = profile?.full_name || profile?.company_name || "there";

    const result = await sendNotificationEmail({
      to: email,
      clientName,
      title: n.title,
      body: n.body || "",
      linkUrl: n.link_url || undefined,
    });

    await supabase.from("notifications").update({ email_sent: result.sent }).eq("id", n.id);
    processed++;
  }

  return NextResponse.json({ processed });
}
