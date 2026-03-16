import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { squareClient } from "@/lib/square";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-square-hmacsha256-signature");
    const webhookUrl =
      process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/square";

    const expectedSignature = crypto
      .createHmac("sha256", process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!)
      .update(webhookUrl + body)
      .digest("base64");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.type === "payment.completed") {
      const payment = event.data?.object?.payment ?? event.data?.object;
      let invoiceId: string | null = null;

      const orderId = payment?.orderId ?? payment?.order_id;
      if (orderId) {
        const orderResponse = await squareClient.orders.get({ orderId });
        const meta = orderResponse?.order?.metadata;
        invoiceId = meta?.invoice_id ?? meta?.["invoice_id"] ?? null;
      }

      if (!invoiceId) {
        const note = payment?.note ?? "";
        const match = note.match(/invoice_id:([a-f0-9-]{36})/i);
        if (match) invoiceId = match[1];
      }

      if (invoiceId) {
        const supabase = await createServiceClient();
        const { error } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);

        if (error) console.error("Square webhook: failed to update invoice", invoiceId, error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Square webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
