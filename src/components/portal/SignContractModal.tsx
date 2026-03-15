"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createClient } from "@/lib/supabase/client";
import { SignaturePad } from "./SignaturePad";
import { X, Loader2, CheckCircle, Mail } from "lucide-react";

type Contract = {
  id: string;
  client_id: string;
  name: string;
  file_url: string;
  status: string;
  signed_at: string | null;
  created_at: string;
};

type SignContractModalProps = {
  contract: Contract;
  onClose: () => void;
  onSigned: () => void;
};

function formatDateForInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function SignContractModal({ contract, onClose, onSigned }: SignContractModalProps) {
  const [step, setStep] = useState<"preview" | "sign" | "success">("preview");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signDate, setSignDate] = useState(formatDateForInput(new Date()));
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignatureCapture(dataUrl: string) {
    setSignatureData(dataUrl);
  }

  async function handleConfirmSign() {
    if (!signatureData) return;

    setSigning(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch the PDF
      const pdfResponse = await fetch(contract.file_url);
      if (!pdfResponse.ok) throw new Error("Failed to fetch contract");
      const pdfBytes = await pdfResponse.arrayBuffer();

      // Load PDF and add signature
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();

      // Convert data URL to PNG bytes
      const base64 = signatureData.split(",")[1];
      if (!base64) throw new Error("Invalid signature");
      const binary = atob(base64);
      const pngBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) pngBytes[i] = binary.charCodeAt(i);

      const signatureImage = await pdfDoc.embedPng(pngBytes);

      // Scale signature to reasonable size (e.g. 150px wide) and place at bottom
      const sigWidth = 150;
      const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;
      const margin = 50;

      lastPage.drawImage(signatureImage, {
        x: width - sigWidth - margin,
        y: margin,
        width: sigWidth,
        height: sigHeight,
      });

      // Add "Signed on" text
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      lastPage.drawText(`Signed on ${new Date().toLocaleDateString()}`, {
        x: width - sigWidth - margin,
        y: margin - 14,
        size: 10,
        font,
      });

      const signedPdfBytes = await pdfDoc.save();

      // Upload signed PDF to storage
      const path = `${contract.client_id}/contracts/signed-${contract.id}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("client-files")
        .upload(path, signedPdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from("client-files").getPublicUrl(path);

      // Update contract
      const { error: updateError } = await supabase
        .from("client_contracts")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signed_file_url: urlData.publicUrl,
        })
        .eq("id", contract.id);

      if (updateError) throw new Error(updateError.message);

      // Send signed copy to client's email
      await fetch("/api/contracts/send-signed-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: contract.id }),
      });

      onSigned();
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign contract");
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border shrink-0">
        <h3 className="text-white font-medium truncate">
          {contract.name} {step === "sign" && "— Draw your signature"}
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-muted hover:text-white rounded-lg"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto">
        {step === "success" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">Contract signed!</h3>
            <p className="text-muted mb-4">
              <span className="inline-flex items-center gap-2 text-primary-light">
                <Mail size={18} />
                Check your email for a copy of the signed document.
              </span>
            </p>
            <p className="text-muted text-sm mb-6">
              We&apos;ve sent a copy to your inbox. You can also download it from your client portal at any time.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        ) : step === "preview" ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-[300px]">
              <iframe
                src={contract.file_url}
                title={contract.name}
                className="w-full h-full min-h-[400px]"
              />
            </div>
            <div className="p-4 border-t border-border bg-surface">
              <p className="text-muted text-sm mb-4">
                Review the contract above. When ready, click below to draw your signature.
              </p>
              <button
                onClick={() => setStep("sign")}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
              >
                Draw signature to sign
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 p-4 gap-4 overflow-auto">
            <div className="flex-1 min-h-[200px]">
              <iframe
                src={contract.file_url}
                title={contract.name}
                className="w-full h-64 rounded-lg border border-border"
              />
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border">
              <p className="text-white font-medium mb-2">Signing date</p>
              <input
                type="date"
                value={signDate}
                onChange={(e) => setSignDate(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-lg px-4 py-2.5 text-white mb-4"
              />
              <p className="text-white font-medium mb-3">Draw your signature below</p>
              <SignaturePad
                onCapture={handleSignatureCapture}
                onClear={() => setSignatureData(null)}
                width={400}
                height={120}
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("preview")}
                className="flex-1 py-3 border border-border hover:border-primary text-white rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmSign}
                disabled={!signatureData || signing}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {signing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing...
                  </>
                ) : (
                  "Confirm & sign"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
