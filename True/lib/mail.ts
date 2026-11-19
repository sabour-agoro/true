import { chemiseLabel, colorLabel, logoLabel, parseChemiseKey, sleeveLabel } from "@/data/chemises";
import { site } from "@/data/site";
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

  const fit = parseChemiseKey(pass.outfit);
  const lastMethod = pass.payments[pass.payments.length - 1]?.method ?? pass.pending?.method;
  const methodLabel = lastMethod === "flooz" ? "Flooz (Moov)" : "Mixx by Yas (TOGOCEL)";
  const ownerText = [
    `Nouveau pass payé · ${pass.code}`,
    "",
    `Nom : ${pass.name || "non renseigné"}`,
    `Téléphone : ${pass.phone ? `+228 ${pass.phone}` : "non renseigné"}`,
    `E-mail : ${pass.email || "non renseigné"}`,
    "",
    "À produire :",
    `Couleur : ${fit ? colorLabel[fit.color] : "?"}`,
    `Manches : ${fit ? sleeveLabel[fit.sleeve] : "?"}`,
    `Logo : ${fit ? `${logoLabel[fit.logo]}${fit.logo === "true" ? " (poitrine)" : " (dos)"}` : "?"}`,
    `Taille : ${pass.size}`,
    "",
    `Montant payé : ${pass.paid.toLocaleString("fr-FR")} F CFA`,
    `Paiement : ${methodLabel}`,
    `Événement : ${site.eventDateLabel} · ${site.eventVenueLabel}`,
  ].join("\n");

  const ownerHtml = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e4e4e7;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Nouveau pass payé</p>
      <h1 style="margin:0 0 16px;font-size:24px;color:#09090b;font-family:monospace;letter-spacing:3px;">${pass.code}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#18181b;">
        <tr><td style="padding:6px 0;color:#71717a;">Nom</td><td style="padding:6px 0;font-weight:600;">${pass.name || "non renseigné"}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Téléphone</td><td style="padding:6px 0;font-weight:600;">${pass.phone ? `+228 ${pass.phone}` : "non renseigné"}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">E-mail</td><td style="padding:6px 0;">${pass.email || "non renseigné"}</td></tr>
      </table>
      <div style="margin:18px 0;padding:16px;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">À produire</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;color:#09090b;">
          <tr><td style="padding:4px 0;color:#71717a;width:110px;">Couleur</td><td style="padding:4px 0;font-weight:700;">${fit ? colorLabel[fit.color] : "?"}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">Manches</td><td style="padding:4px 0;font-weight:700;">${fit ? sleeveLabel[fit.sleeve] : "?"}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">Logo</td><td style="padding:4px 0;font-weight:700;">${fit ? `${logoLabel[fit.logo]} · ${fit.logo === "true" ? "poitrine" : "dos"}` : "?"}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">Taille</td><td style="padding:4px 0;font-weight:700;font-size:18px;">${pass.size}</td></tr>
        </table>
      </div>
      <p style="margin:0;font-size:13px;color:#52525b;">Montant payé : <strong>${pass.paid.toLocaleString("fr-FR")} F CFA</strong> · ${methodLabel}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#52525b;">Événement : ${site.eventDateLabel} · ${site.eventVenueLabel}</p>
    </div>
  </div>`;

  // Le patron reçoit toujours le mail ; le client seulement s'il a laissé un e-mail.
  await mailer.sendMail({
    from,
    to: owner,
    subject: `TRUE · Pass payé · ${fit ? `${colorLabel[fit.color]} ${sleeveLabel[fit.sleeve]} ${logoLabel[fit.logo]}` : outfitName} · ${pass.size} · ${pass.code}`,
    text: ownerText,
    html: ownerHtml,
  });

  if (pass.email) {
    await mailer.sendMail({
      from,
      to: pass.email,
      subject: unlocked ? (french ? "Ton pass — lancement officiel TRUE" : "Your official launch pass TRUE") : french ? "Ton code TRUE" : "Your TRUE code",
      text: customerText,
      html: customerHtml,
      attachments,
    });
  }

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
