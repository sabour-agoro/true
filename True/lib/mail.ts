import { chemiseLabel } from "@/data/chemises";
import { passQrPayload } from "@/lib/pass-seal";
import { generateTicketPng } from "@/lib/pass-ticket";
import type { Pass } from "@/lib/passes";
import QRCode from "qrcode";
import nodemailer from "nodemailer";

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

export async function sendPassMails(pass: Pass) {
  const mailer = transport();
  if (!mailer) return false;

  const outfitName = chemiseLabel(pass.outfit);
  const remaining = Math.max(0, pass.total - pass.paid);
  const unlocked = remaining === 0;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const owner = process.env.ORDER_NOTIFY_EMAIL || "abdoulsabouragoro@gmail.com";
  const french = pass.locale !== "en";

  const customerText = unlocked
    ? french
      ? `Ton pass pour le lancement officiel est débloqué.\nCode : ${pass.code}\nTenue : ${outfitName}, taille ${pass.size}.\nTon billet officiel et ton QR code sont joints à cet email. Montre-les à l'entrée.`
      : `Your pass for the official launch is unlocked.\nCode: ${pass.code}\nOutfit: ${outfitName}, size ${pass.size}.\nYour official ticket and QR code are attached. Show them at the door.`
    : french
      ? `Tu as payé ${pass.paid.toLocaleString("fr-FR")} F CFA. Il reste ${remaining.toLocaleString("fr-FR")} F CFA pour débloquer le pass du lancement officiel.\nCode : ${pass.code}\nTenue : ${outfitName}, taille ${pass.size}.\nGarde ce code : tu le ressaisis pour continuer le paiement.`
      : `You paid ${pass.paid.toLocaleString("en-US")} F CFA. ${remaining.toLocaleString("en-US")} F CFA remain to unlock the official launch pass.\nCode: ${pass.code}\nOutfit: ${outfitName}, size ${pass.size}.\nKeep this code and enter it for the next payment.`;

  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];

  if (unlocked) {
    const qr = await QRCode.toBuffer(passQrPayload(pass.code), { width: 480, margin: 1 }).catch(() => null);
    if (qr) {
      attachments.push({ filename: `qr-${pass.code}.png`, content: qr, contentType: "image/png" });
    }
    const ticket = await generateTicketPng(pass).catch(() => null);
    if (ticket) {
      attachments.push({ filename: `pass-true-${pass.code}.png`, content: ticket, contentType: "image/png" });
    }
  }

  const customerHtml = unlocked
    ? `
    <div style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; border: 1px solid #d4af37; border-radius: 12px; padding: 32px; background-color: #121214;">
        <h1 style="color: #d4af37; letter-spacing: 6px; font-size: 28px; margin: 0 0 8px 0;">T R U E</h1>
        <p style="color: #a1a1aa; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 24px 0;">Lancement officiel de la marque</p>
        
        <div style="display: inline-block; background-color: #1c1917; border: 1px solid #22c55e; border-radius: 20px; padding: 6px 16px; margin-bottom: 24px;">
          <span style="color: #22c55e; font-size: 12px; font-weight: bold; letter-spacing: 1px;">✓ PASS DÉBLOQUÉ</span>
        </div>

        <div style="background-color: #18181b; border-radius: 8px; padding: 18px; margin-bottom: 24px; text-align: left;">
          <p style="color: #71717a; font-size: 11px; margin: 0 0 4px 0; letter-spacing: 1px;">INVITÉ(E)</p>
          <p style="color: #f4f4f5; font-size: 18px; font-weight: bold; margin: 0 0 16px 0;">${pass.name}</p>

          <p style="color: #71717a; font-size: 11px; margin: 0 0 4px 0; letter-spacing: 1px;">TENUE RÉSERVÉE</p>
          <p style="color: #f4f4f5; font-size: 15px; margin: 0 0 4px 0;">${outfitName}</p>
          <p style="color: #d4af37; font-size: 13px; margin: 0 0 16px 0;">Taille : ${pass.size}</p>

          <p style="color: #71717a; font-size: 11px; margin: 0 0 4px 0; letter-spacing: 1px;">CODE DU PASS</p>
          <p style="color: #d4af37; font-family: monospace; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 4px;">${pass.code}</p>
        </div>

        <p style="color: #d4af37; font-size: 14px; margin: 16px 0 8px 0;">Ton pass officiel au format image (PNG) est joint à cet email.</p>
        <p style="color: #71717a; font-size: 12px; margin: 0;">Présente le QR code joint à l'entrée de la soirée.</p>
      </div>
    </div>
    `
    : undefined;

  await mailer.sendMail({
    from,
    to: pass.email,
    subject: unlocked ? (french ? "Ton pass — lancement officiel TRUE" : "Your official launch pass TRUE") : french ? "Ton code TRUE" : "Your TRUE code",
    text: customerText,
    html: customerHtml,
    attachments,
  });

  await mailer.sendMail({
    from,
    to: owner,
    subject: `TRUE · ${pass.name} · ${pass.paid} / ${pass.total}`,
    text: `${pass.name} <${pass.email}>\nCode ${pass.code}\n${outfitName} · ${pass.size}\nPayé ${pass.paid} F CFA · reste ${remaining} F CFA`,
  });

  return true;
}

export async function sendContactMail(input: { name: string; email: string; message: string }) {
  const mailer = transport();
  if (!mailer) return false;

  const owner = process.env.ORDER_NOTIFY_EMAIL || "abdoulsabouragoro@gmail.com";
  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: owner,
    replyTo: input.email,
    subject: `TRUE · ${input.name}`,
    text: `${input.name} <${input.email}>\n\n${input.message}`,
  });
  return true;
}
