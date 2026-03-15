import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  // Get Sarah's id
  const { data: sarah } = await supabase
    .from("profiles")
    .select("id")
    .eq("full_name", "Sarah Mitchell")
    .single();

  if (!sarah) {
    console.log("Sarah not found");
    return;
  }

  console.log("Sarah ID:", sarah.id);

  // Get all quotes for Sarah (bypass RLS with service role)
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("client_id", sarah.id)
    .order("created_at", { ascending: false });

  console.log("Quotes for Sarah:", quotes?.length);
  if (error) console.log("Error:", error.message);
  quotes?.forEach((q) => {
    console.log("  -", q.id.slice(0, 8), "total:", q.total, "type:", typeof q.total, "status:", q.status);
    console.log("    line_items:", JSON.stringify(q.line_items?.[0]));
  });

  // Simulate client auth - sign in as Sarah and try to fetch
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: session } = await anonClient.auth.signInWithPassword({
    email: "sarah@greenvalleyfarm.com",
    password: "client123456",
  });

  if (!session.user) {
    console.log("Login failed");
    return;
  }

  const { data: clientQuotes, error: clientErr } = await anonClient
    .from("quotes")
    .select("*")
    .eq("client_id", session.user.id)
    .order("created_at", { ascending: false });

  console.log("\nAs Sarah (anon key + auth):");
  console.log("  Quotes returned:", clientQuotes?.length);
  if (clientErr) console.log("  Error:", clientErr.message);
}

check().catch(console.error);
