import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { squareClient } from "@/lib/square";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, profiles(full_name, company_name)")
      .eq("id", invoiceId)
      .eq("client_id", user.id)
      .single();

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const lineItems = invoice.line_items.map(
      (item: { description: string; quantity: number; unit_price: number }) => ({
        name: item.description,
        quantity: String(item.quantity),
        basePriceMoney: {
          amount: BigInt(Math.round(item.unit_price * 100)),
          currency: "USD",
        },
      })
    );

    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID!,
        lineItems,
        metadata: {
          invoice_id: invoiceId,
        },
      },
      checkoutOptions: {
        redirectUrl: `${appUrl}/portal/invoices?paid=${invoiceId}`,
        askForShippingAddress: false,
      },
    });

    if (response.paymentLink?.url) {
      await supabase
        .from("invoices")
        .update({ square_payment_link: response.paymentLink.url })
        .eq("id", invoiceId);

      return NextResponse.json({ checkoutUrl: response.paymentLink.url });
    }

    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Square checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
