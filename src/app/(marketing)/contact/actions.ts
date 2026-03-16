"use server";

import { createClient } from "@supabase/supabase-js";
import { sendContactConfirmationEmail } from "@/lib/email";

export type ContactResult = { success: true } | { success: false; error: string };

export async function submitContact(data: {
  name: string;
  email: string;
  message: string;
  organization?: string;
  type?: string;
}): Promise<ContactResult> {
  const name = data.name?.trim();
  const email = data.email?.trim();
  const message = data.message?.trim();
  const organization = data.organization?.trim() || null;
  const type = data.type?.trim() || null;

  if (!name || !email || !message) {
    return { success: false, error: "Name, email, and message are required." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      success: false,
      error: "Server configuration error. Please email us directly at info@MikeTintnerProductions.com.",
    };
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
    console.error("Contact form insert error:", error.message);
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return {
        success: false,
        error: "Form is being set up. Please email us directly at info@MikeTintnerProductions.com in the meantime.",
      };
    }
    return {
      success: false,
      error: "Failed to submit. Please try again or email us at info@MikeTintnerProductions.com.",
    };
  }

  await sendContactConfirmationEmail({ to: email, name });

  return { success: true };
}
