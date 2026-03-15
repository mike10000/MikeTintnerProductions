import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verify() {
  console.log("=== Verifying Accounts ===\n");

  // Check auth users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error listing users:", usersError.message);
    return;
  }

  console.log(`Auth users found: ${users.users.length}`);
  users.users.forEach((u) => {
    console.log(`  ${u.email} (confirmed: ${!!u.email_confirmed_at})`);
  });

  // Check profiles
  console.log("\nProfiles in database:");
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*");

  if (profilesError) {
    console.error("Error reading profiles:", profilesError.message);
    return;
  }

  profiles?.forEach((p) => {
    console.log(`  ${p.full_name.padEnd(22)} role: ${p.role.padEnd(8)} company: ${p.company_name || "—"}`);
  });

  // Test login
  console.log("\nTesting login with sarah@greenvalleyfarm.com...");
  const clientSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: session, error: loginError } = await clientSupabase.auth.signInWithPassword({
    email: "sarah@greenvalleyfarm.com",
    password: "client123456",
  });

  if (loginError) {
    console.error("  Login FAILED:", loginError.message);
  } else {
    console.log("  Login SUCCESS! User ID:", session.user.id);
  }

  console.log("\nTesting login with info@MikeTintnerProductions.com...");
  const { data: adminSession, error: adminError } = await clientSupabase.auth.signInWithPassword({
    email: "info@MikeTintnerProductions.com",
    password: "admin123456",
  });

  if (adminError) {
    console.error("  Login FAILED:", adminError.message);
  } else {
    console.log("  Login SUCCESS! User ID:", adminSession.user.id);
  }
}

verify().catch(console.error);
