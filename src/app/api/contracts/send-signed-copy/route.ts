import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSignedContractEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contractId } = await request.json();
    if (!contractId) {
      return NextResponse.json({ error: "contractId required" }, { status: 400 });
    }

    const { data: contract, error: contractError } = await supabase
      .from("client_contracts")
      .select("id, name, client_id, signed_file_url, status")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (contract.status !== "signed" || !contract.signed_file_url) {
      return NextResponse.json(
        { error: "Contract not signed or signed copy not available" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const clientName = profile?.full_name || "there";

    const result = await sendSignedContractEmail({
      to: user.email,
      clientName,
      contractName: contract.name,
      signedPdfUrl: contract.signed_file_url,
    });

    if (!result.sent) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send signed copy error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
