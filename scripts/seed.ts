import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = "info@MikeTintnerProductions.com";
const ADMIN_PASSWORD = "admin123456";

const CLIENTS = [
  {
    email: "sarah@greenvalleyfarm.com",
    password: "client123456",
    full_name: "Sarah Mitchell",
    company_name: "Green Valley Farm",
  },
  {
    email: "james@riverkeepers.org",
    password: "client123456",
    full_name: "James Worthington",
    company_name: "Riverkeepers Alliance",
  },
  {
    email: "maria@mainstreetbakery.com",
    password: "client123456",
    full_name: "Maria Gonzalez",
    company_name: "Main Street Bakery",
  },
  {
    email: "devon@hollownotes.com",
    password: "client123456",
    full_name: "Devon Clarke",
    company_name: "The Hollow Notes",
  },
  {
    email: "pat@communityfoodshelf.org",
    password: "client123456",
    full_name: "Pat Nguyen",
    company_name: "Community Food Shelf",
  },
];

async function createUser(
  email: string,
  password: string,
  fullName: string,
  companyName: string,
  role: string
) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, company_name: companyName },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log(`  User ${email} already exists, fetching...`);
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (existing) {
        await supabase
          .from("profiles")
          .update({ role, full_name: fullName, company_name: companyName })
          .eq("id", existing.id);
        return existing.id;
      }
      return null;
    }
    console.error(`  Error creating ${email}:`, error.message);
    return null;
  }

  await supabase
    .from("profiles")
    .update({ role, full_name: fullName, company_name: companyName })
    .eq("id", data.user.id);

  return data.user.id;
}

async function seed() {
  console.log("=== Seeding Mike Tintner Productions ===\n");

  // Create admin
  console.log("1. Creating admin account...");
  const adminId = await createUser(
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    "Mike Tintner",
    "Mike Tintner Productions",
    "admin"
  );
  if (!adminId) {
    console.error("Failed to create admin. Aborting.");
    process.exit(1);
  }
  console.log(`   Admin created: ${ADMIN_EMAIL}\n`);

  // Create clients
  console.log("2. Creating client accounts...");
  const clientIds: string[] = [];
  for (const client of CLIENTS) {
    const id = await createUser(
      client.email,
      client.password,
      client.full_name,
      client.company_name,
      "client"
    );
    if (id) {
      clientIds.push(id);
      console.log(`   Created: ${client.full_name} (${client.email})`);
    }
  }
  console.log();

  // Create work orders
  console.log("3. Creating work orders...");
  const workOrders = [
    {
      client_id: clientIds[0],
      title: "New website for CSA program",
      description:
        "We need a website to manage our CSA memberships, show weekly harvest updates, and have an online farm store. Should have a rustic but modern feel with lots of farm photography.",
      status: "in_progress",
      priority: "high",
    },
    {
      client_id: clientIds[0],
      title: "Add event calendar for farm dinners",
      description:
        "We want to add a calendar page for our farm-to-table dinner events with RSVP functionality.",
      status: "submitted",
      priority: "medium",
    },
    {
      client_id: clientIds[1],
      title: "Redesign organization website",
      description:
        "Our current site is outdated. Need a modern site with action alerts, donation integration, and interactive river health maps. Must be mobile-friendly.",
      status: "review",
      priority: "high",
    },
    {
      client_id: clientIds[2],
      title: "Online ordering system",
      description:
        "Need to add online ordering for pickup and delivery. Should integrate with our POS system and show real-time menu availability.",
      status: "in_progress",
      priority: "urgent",
    },
    {
      client_id: clientIds[3],
      title: "Band website with EPK",
      description:
        "Need a website with embedded music player (Spotify/Bandcamp), tour dates, merch shop, and a downloadable electronic press kit for venues and promoters.",
      status: "submitted",
      priority: "medium",
    },
    {
      client_id: clientIds[4],
      title: "Donation platform overhaul",
      description:
        "Rebuild our donation page to support recurring donations, employer matching, and impact reporting. Need a volunteer signup form too.",
      status: "completed",
      priority: "high",
    },
  ];

  const { data: insertedOrders } = await supabase
    .from("work_orders")
    .insert(workOrders)
    .select();
  console.log(`   Created ${insertedOrders?.length || 0} work orders\n`);

  // Create quotes
  console.log("4. Creating quotes...");
  const quotes = [
    {
      client_id: clientIds[0],
      work_order_id: insertedOrders?.[0]?.id,
      line_items: [
        { description: "Website Design & Development", quantity: 1, unit_price: 2500 },
        { description: "CSA Membership Portal", quantity: 1, unit_price: 800 },
        { description: "Farm Store (E-commerce)", quantity: 1, unit_price: 1200 },
        { description: "Content Migration", quantity: 1, unit_price: 300 },
      ],
      total: 4800,
      status: "accepted",
    },
    {
      client_id: clientIds[1],
      work_order_id: insertedOrders?.[2]?.id,
      line_items: [
        { description: "Full Website Redesign", quantity: 1, unit_price: 3200 },
        { description: "Interactive Maps Integration", quantity: 1, unit_price: 1500 },
        { description: "Donation System Setup", quantity: 1, unit_price: 600 },
        { description: "SEO Optimization", quantity: 1, unit_price: 400 },
      ],
      total: 5700,
      status: "sent",
    },
    {
      client_id: clientIds[2],
      work_order_id: insertedOrders?.[3]?.id,
      line_items: [
        { description: "Online Ordering System", quantity: 1, unit_price: 2000 },
        { description: "POS Integration", quantity: 1, unit_price: 800 },
        { description: "Menu Management CMS", quantity: 1, unit_price: 500 },
      ],
      total: 3300,
      status: "accepted",
    },
    {
      client_id: clientIds[3],
      work_order_id: insertedOrders?.[4]?.id,
      line_items: [
        { description: "Artist Website Design", quantity: 1, unit_price: 1800 },
        { description: "Music Player Integration", quantity: 1, unit_price: 400 },
        { description: "Merch Shop Setup", quantity: 1, unit_price: 600 },
        { description: "EPK Page", quantity: 1, unit_price: 300 },
      ],
      total: 3100,
      status: "sent",
    },
    {
      client_id: clientIds[4],
      work_order_id: insertedOrders?.[5]?.id,
      line_items: [
        { description: "Donation Platform Rebuild", quantity: 1, unit_price: 2200 },
        { description: "Recurring Donation Setup", quantity: 1, unit_price: 500 },
        { description: "Volunteer Portal", quantity: 1, unit_price: 700 },
        { description: "Impact Dashboard", quantity: 1, unit_price: 900 },
      ],
      total: 4300,
      status: "accepted",
    },
  ];

  await supabase.from("quotes").insert(quotes);
  console.log(`   Created ${quotes.length} quotes\n`);

  // Create invoices
  console.log("5. Creating invoices...");
  const invoices = [
    {
      client_id: clientIds[0],
      work_order_id: insertedOrders?.[0]?.id,
      line_items: [
        { description: "Website Design & Development (50% deposit)", quantity: 1, unit_price: 2400 },
      ],
      total: 2400,
      status: "paid",
      due_date: "2026-02-15",
      paid_at: "2026-02-12T14:30:00Z",
    },
    {
      client_id: clientIds[0],
      work_order_id: insertedOrders?.[0]?.id,
      line_items: [
        { description: "Website Design & Development (final 50%)", quantity: 1, unit_price: 2400 },
      ],
      total: 2400,
      status: "sent",
      due_date: "2026-04-01",
    },
    {
      client_id: clientIds[2],
      work_order_id: insertedOrders?.[3]?.id,
      line_items: [
        { description: "Online Ordering System - Full Payment", quantity: 1, unit_price: 3300 },
      ],
      total: 3300,
      status: "sent",
      due_date: "2026-03-30",
    },
    {
      client_id: clientIds[4],
      work_order_id: insertedOrders?.[5]?.id,
      line_items: [
        { description: "Donation Platform - Final Invoice", quantity: 1, unit_price: 4300 },
      ],
      total: 4300,
      status: "paid",
      due_date: "2026-02-28",
      paid_at: "2026-02-25T10:15:00Z",
    },
    {
      client_id: clientIds[1],
      line_items: [
        { description: "Website Redesign - Deposit (40%)", quantity: 1, unit_price: 2280 },
      ],
      total: 2280,
      status: "overdue",
      due_date: "2026-03-01",
    },
  ];

  await supabase.from("invoices").insert(invoices);
  console.log(`   Created ${invoices.length} invoices\n`);

  // Create conversations & messages
  console.log("6. Creating conversations & messages...");

  const convos = [
    { client_id: clientIds[0], subject: "CSA website color scheme" },
    { client_id: clientIds[1], subject: "Map integration question" },
    { client_id: clientIds[2], subject: "Menu photo uploads" },
    { client_id: clientIds[3], subject: "Spotify embed options" },
    { client_id: clientIds[4], subject: "Thank you!" },
  ];

  const { data: insertedConvos } = await supabase
    .from("conversations")
    .insert(convos)
    .select();

  const messages = [
    // Sarah - CSA website
    { conversation_id: insertedConvos?.[0]?.id, sender_id: clientIds[0], body: "Hi Mike! I was thinking about earthy greens and warm browns for the color scheme. What do you think?", read: true },
    { conversation_id: insertedConvos?.[0]?.id, sender_id: adminId, body: "Love that direction, Sarah! I'll put together a mood board with some palette options. Earthy tones will really resonate with your CSA audience. Give me a day or two.", read: true },
    { conversation_id: insertedConvos?.[0]?.id, sender_id: clientIds[0], body: "Sounds great! Also, can we use some of the photos from our last harvest festival?", read: true },
    { conversation_id: insertedConvos?.[0]?.id, sender_id: adminId, body: "Absolutely! Go ahead and upload them through the portal or email them to me. High-res if possible.", read: false },

    // James - Map integration
    { conversation_id: insertedConvos?.[1]?.id, sender_id: clientIds[1], body: "Hey Mike, for the river health maps - can we make them interactive so visitors can click on different river sections and see water quality data?", read: true },
    { conversation_id: insertedConvos?.[1]?.id, sender_id: adminId, body: "Definitely! I'm thinking we use Mapbox with custom overlays. We can color-code sections by water quality grade and show detailed info in popups. I'll prototype it this week.", read: true },
    { conversation_id: insertedConvos?.[1]?.id, sender_id: clientIds[1], body: "That would be amazing. Our board is going to love this. Can we also show historical data?", read: false },

    // Maria - Menu photos
    { conversation_id: insertedConvos?.[2]?.id, sender_id: clientIds[2], body: "Mike, I have about 40 menu item photos ready. What's the best way to get them to you? Some are pretty large files.", read: true },
    { conversation_id: insertedConvos?.[2]?.id, sender_id: adminId, body: "I'll set up a shared folder for you - I'll send the link shortly. Don't worry about file size, I'll optimize them for the web. Just make sure they're well-lit and appetizing!", read: true },

    // Devon - Spotify
    { conversation_id: insertedConvos?.[3]?.id, sender_id: clientIds[3], body: "Quick question - should we embed full Spotify player or just preview clips? We also have stuff on Bandcamp and SoundCloud.", read: true },
    { conversation_id: insertedConvos?.[3]?.id, sender_id: adminId, body: "Good question! I'd recommend embedding Spotify as the primary player since most people use it, but we can add Bandcamp and SoundCloud links too. We'll have a clean music section with album art, track listings, and streaming links for each platform.", read: false },

    // Pat - Thank you
    { conversation_id: insertedConvos?.[4]?.id, sender_id: clientIds[4], body: "Mike, just wanted to say the new donation platform is incredible! We saw a 40% increase in online donations the first week after launch. The recurring donation feature has been a game-changer. Thank you so much!", read: true },
    { conversation_id: insertedConvos?.[4]?.id, sender_id: adminId, body: "That's amazing to hear, Pat! A 40% increase is fantastic. The recurring donation feature really does make a difference for nonprofits. Let me know if you need any tweaks. Always happy to help the Food Shelf!", read: true },
  ];

  await supabase.from("messages").insert(messages);
  console.log(`   Created ${convos.length} conversations with ${messages.length} messages\n`);

  // Create a Kanban board
  console.log("7. Creating Kanban board with tasks...");

  const { data: board } = await supabase
    .from("boards")
    .insert({ name: "Green Valley Farm - CSA Website", work_order_id: insertedOrders?.[0]?.id })
    .select()
    .single();

  const columnDefs = ["Backlog", "To Do", "In Progress", "Review", "Done"];
  const { data: columns } = await supabase
    .from("board_columns")
    .insert(columnDefs.map((title, i) => ({ board_id: board!.id, title, position: i })))
    .select();

  const colMap: Record<string, string> = {};
  columns?.forEach((c) => { colMap[c.title] = c.id; });

  const tasks = [
    // Backlog
    { column_id: colMap["Backlog"], title: "Set up analytics (Google Analytics + Hotjar)", position: 0, priority: "low", labels: ["analytics"], client_visible: false },
    { column_id: colMap["Backlog"], title: "Write meta descriptions for all pages", position: 1, priority: "low", labels: ["seo"], client_visible: false },
    { column_id: colMap["Backlog"], title: "Create favicon and social share images", position: 2, priority: "low", labels: ["design"], client_visible: false },

    // To Do
    { column_id: colMap["To Do"], title: "Build farm store product pages", position: 0, priority: "high", labels: ["development", "e-commerce"], client_visible: true, description: "Each product needs: photo, description, price, add-to-cart button. Support for seasonal availability." },
    { column_id: colMap["To Do"], title: "Integrate Stripe for farm store payments", position: 1, priority: "high", labels: ["development", "payments"], client_visible: false },
    { column_id: colMap["To Do"], title: "Design harvest update email template", position: 2, priority: "medium", labels: ["design", "email"], client_visible: true },

    // In Progress
    { column_id: colMap["In Progress"], title: "CSA membership signup flow", position: 0, priority: "urgent", labels: ["development", "feature"], client_visible: true, assignee_id: adminId, description: "3-step form: select share size, choose pickup location, payment. Must support seasonal and year-round memberships.", due_date: "2026-03-20" },
    { column_id: colMap["In Progress"], title: "Homepage hero section with farm photos", position: 1, priority: "high", labels: ["design"], client_visible: true, assignee_id: adminId, due_date: "2026-03-18" },

    // Review
    { column_id: colMap["Review"], title: "About page with farm story and team bios", position: 0, priority: "medium", labels: ["content", "design"], client_visible: true, assignee_id: adminId, description: "Sarah to review the copy and photos. Need her approval on the team bio section." },
    { column_id: colMap["Review"], title: "Mobile responsive navigation", position: 1, priority: "high", labels: ["development"], client_visible: false, assignee_id: adminId },

    // Done
    { column_id: colMap["Done"], title: "Wireframes and sitemap", position: 0, priority: "high", labels: ["design", "planning"], client_visible: true },
    { column_id: colMap["Done"], title: "Domain and hosting setup", position: 1, priority: "urgent", labels: ["devops"], client_visible: false },
    { column_id: colMap["Done"], title: "Color palette and typography selection", position: 2, priority: "medium", labels: ["design", "branding"], client_visible: true },
    { column_id: colMap["Done"], title: "Contact page with location map", position: 3, priority: "medium", labels: ["development"], client_visible: true },
  ];

  await supabase.from("tasks").insert(tasks);
  console.log(`   Created board "${board!.name}" with ${tasks.length} tasks\n`);

  // Second board
  const { data: board2 } = await supabase
    .from("boards")
    .insert({ name: "Main Street Bakery - Online Ordering", work_order_id: insertedOrders?.[3]?.id })
    .select()
    .single();

  const { data: columns2 } = await supabase
    .from("board_columns")
    .insert(columnDefs.map((title, i) => ({ board_id: board2!.id, title, position: i })))
    .select();

  const colMap2: Record<string, string> = {};
  columns2?.forEach((c) => { colMap2[c.title] = c.id; });

  const tasks2 = [
    { column_id: colMap2["To Do"], title: "Build menu item management CMS", position: 0, priority: "high", labels: ["development"], client_visible: true },
    { column_id: colMap2["To Do"], title: "Design order confirmation emails", position: 1, priority: "medium", labels: ["design"], client_visible: false },
    { column_id: colMap2["In Progress"], title: "Shopping cart and checkout flow", position: 0, priority: "urgent", labels: ["development", "payments"], client_visible: true, assignee_id: adminId, due_date: "2026-03-22" },
    { column_id: colMap2["In Progress"], title: "Menu page with categories and filters", position: 1, priority: "high", labels: ["development", "design"], client_visible: true, assignee_id: adminId },
    { column_id: colMap2["Done"], title: "Gather menu items and photos from Maria", position: 0, priority: "high", labels: ["content"], client_visible: true },
  ];

  await supabase.from("tasks").insert(tasks2);
  console.log(`   Created board "${board2!.name}" with ${tasks2.length} tasks\n`);

  // Summary
  console.log("=== Seeding Complete! ===\n");
  console.log("ADMIN LOGIN:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  URL:      http://localhost:3000/admin\n`);
  console.log("CLIENT LOGINS (all passwords: client123456):");
  CLIENTS.forEach((c) => {
    console.log(`  ${c.full_name.padEnd(20)} ${c.email}`);
  });
  console.log();
}

seed().catch(console.error);
