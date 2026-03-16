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

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return NextResponse.json(
        { error: "Square is not configured. Please add SQUARE_LOCATION_ID in Settings." },
        { status: 500 }
      );
    }

    // Use Quick Pay (simpler, more reliable) - single total amount
    const totalCents = Math.round(Number(invoice.total) * 100);
    const description =
      invoice.line_items?.length > 0
        ? invoice.line_items.map((i: { description: string }) => i.description).join(", ")
        : "Invoice payment";

    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      quickPay: {
        name: description.length > 100 ? `Invoice #${invoiceId.slice(0, 8)}` : description,
        priceMoney: {
          amount: BigInt(totalCents),
          currency: "USD",
        },
        locationId,
      },
      checkoutOptions: {
        redirectUrl: `${appUrl}/portal/invoices?paid=${invoiceId}`,
        askForShippingAddress: false,
      },
      paymentNote: `invoice_id:${invoiceId}`,
    });

    const url = response.paymentLink?.url ?? response.paymentLink?.longUrl;
    if (url) {
      await supabase
        .from("invoices")
        .update({ square_payment_link: url })
        .eq("id", invoiceId);

      return NextResponse.json({ checkoutUrl: url });
    }

    const errMsg = response.errors?.[0]?.detail ?? "Failed to create payment link";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  } catch (error: unknown) {
    console.error("Square checkout error:", error);
    let errMsg = "Payment link could not be created.";
    if (error && typeof error === "object") {
      const e = error as { body?: unknown; message?: string; errors?: { detail?: string }[] };
      if (e.errors?.[0]?.detail) errMsg = e.errors[0].detail;
      else if (e.message) errMsg = e.message;
      else if (typeof e.body === "string") errMsg = e.body;
      else if (e.body && typeof e.body === "object" && "errors" in e.body) {
        const errs = (e.body as { errors?: { detail?: string }[] }).errors;
        if (errs?.[0]?.detail) errMsg = errs[0].detail;
      }
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
