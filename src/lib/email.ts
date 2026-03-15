import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

export async function sendInviteEmail(params: {
  to: string;
  leadName: string;
  estimate: string;
  meetingLink: string;
  inviteUrl: string;
}) {
  const { to, leadName, estimate, meetingLink, inviteUrl } = params;

  if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
    console.warn("SMTP not configured — skipping email send");
    return { sent: false, error: "SMTP not configured" };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e293b;">Hi ${leadName},</h2>
  <p>Thanks for reaching out! Here's your project estimate and next steps.</p>
  
  ${estimate ? `
  <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #0f172a;">Rough estimate</h3>
    <p style="white-space: pre-wrap; margin: 0;">${estimate.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</p>
  </div>
  ` : ""}
  
  ${meetingLink ? `
  <p>
    <strong>Free consultation:</strong><br>
    <a href="${meetingLink}" style="color: #3b82f6;">Book your free consultation here</a>
  </p>
  ` : ""}
  
  <p>Ready to move forward? Click the button below to approve and create your client portal account. You'll get access to view projects, quotes, and communicate with us.</p>
  
  <p style="text-align: center; margin: 32px 0;">
    <a href="${inviteUrl}" style="display: inline-block; background: #3b82f6; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Approve & get portal access</a>
  </p>
  
  <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>
  <a href="${inviteUrl}" style="color: #3b82f6; word-break: break-all;">${inviteUrl}</a></p>
  
  <p style="margin-top: 32px; color: #64748b; font-size: 14px;">— Mike Tintner Productions</p>
</body>
</html>
`;

  try {
    await transporter.sendMail({
      from: `"Mike Tintner Productions" <${process.env.SMTP_USER}>`,
      to,
      subject: "Your project estimate — Mike Tintner Productions",
      html,
      text: `Hi ${leadName},\n\nThanks for reaching out! Here's your project estimate and next steps.\n\n${estimate ? `Estimate:\n${estimate}\n\n` : ""}${meetingLink ? `Free consultation: ${meetingLink}\n\n` : ""}Ready to move forward? Click below to approve and create your client portal account:\n\n${inviteUrl}\n\n— Mike Tintner Productions`,
    });
    return { sent: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Failed to send" };
  }
}

export async function sendSignedContractEmail(params: {
  to: string;
  clientName: string;
  contractName: string;
  signedPdfUrl: string;
}) {
  const { to, clientName, contractName, signedPdfUrl } = params;

  if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
    console.warn("SMTP not configured — skipping signed contract email");
    return { sent: false, error: "SMTP not configured" };
  }

  // Fetch PDF to attach
  let pdfBuffer: Buffer;
  try {
    const res = await fetch(signedPdfUrl);
    if (!res.ok) throw new Error("Failed to fetch PDF");
    const arrayBuffer = await res.arrayBuffer();
    pdfBuffer = Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Failed to fetch signed PDF:", err);
    return { sent: false, error: "Could not fetch signed document" };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e293b;">Hi ${clientName},</h2>
  <p>Your signed copy of <strong>${contractName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong> is attached to this email.</p>
  <p>You can also download it from your client portal at any time.</p>
  <p style="margin-top: 32px; color: #64748b; font-size: 14px;">— Mike Tintner Productions</p>
</body>
</html>
`;

  try {
    await transporter.sendMail({
      from: `"Mike Tintner Productions" <${process.env.SMTP_USER}>`,
      to,
      subject: `Your signed contract: ${contractName}`,
      html,
      text: `Hi ${clientName},\n\nYour signed copy of ${contractName} is attached to this email.\n\nYou can also download it from your client portal at any time.\n\n— Mike Tintner Productions`,
      attachments: [
        {
          filename: contractName.endsWith(".pdf") ? contractName : `${contractName.replace(/\.[^.]+$/, "")}-signed.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    return { sent: true };
  } catch (err) {
    console.error("Signed contract email error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Failed to send" };
  }
}
