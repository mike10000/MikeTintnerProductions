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
      const payment = event.data?.object?.payment;
      const orderId = payment?.orderId;

      if (orderId) {
        const supabase = await createServiceClient();

        const orderResponse = await squareClient.orders.get({ orderId });
        const invoiceId = orderResponse?.order?.metadata?.invoice_id;

        if (invoiceId) {
          await supabase
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", invoiceId);
        }
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
