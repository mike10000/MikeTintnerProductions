import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

async function applySchema() {
  const sql = readFileSync(join(process.cwd(), "supabase", "schema.sql"), "utf-8");

  const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({}),
  });

  // Use the management API to run SQL
  const sqlRes = await fetch(
    `https://${projectRef}.supabase.co/pg/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!sqlRes.ok) {
    // Fallback: try splitting and executing via REST
    console.log("Direct SQL endpoint not available.");
    console.log("Please run the schema SQL manually in the Supabase SQL Editor:");
    console.log(`  1. Go to https://supabase.com/dashboard/project/${projectRef}/sql`);
    console.log("  2. Paste contents of supabase/schema.sql");
    console.log("  3. Click Run");
    process.exit(1);
  }

  const result = await sqlRes.json();
  console.log("Schema applied successfully!", result);
}

applySchema().catch(console.error);
