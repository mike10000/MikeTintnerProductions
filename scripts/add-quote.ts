import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function addQuote() {
  const { data: sarah } = await supabase
    .from("profiles")
    .select("id")
    .eq("full_name", "Sarah Mitchell")
    .single();

  if (!sarah) {
    console.error("Sarah Mitchell not found in profiles");
    process.exit(1);
  }

  const quote = {
    client_id: sarah.id,
    work_order_id: null,
    line_items: [
      { description: "Website consultation & strategy", quantity: 1, unit_price: 200 },
      { description: "Landing page design", quantity: 1, unit_price: 250 },
      { description: "Contact form setup", quantity: 1, unit_price: 100 },
    ],
    total: 550,
    status: "sent",
    valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };

  const { data, error } = await supabase.from("quotes").insert(quote).select().single();

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("Quote created successfully!");
  console.log("Quote ID:", data.id);
  console.log("Client: Sarah Mitchell");
  console.log("Total: $550.00");
  console.log("Status: sent");
  console.log("\nLog in as sarah@greenvalleyfarm.com (password: client123456) and go to /portal/quotes to view it.");
}

addQuote().catch(console.error);
