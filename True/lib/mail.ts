import { getProduct, productName } from "@/data/products";
import { passQrPayload } from "@/lib/pass-seal";
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

  const outfit = getProduct(pass.outfit);
  const outfitName = outfit ? productName(outfit, pass.locale) : pass.outfit;
  const remaining = Math.max(0, pass.total - pass.paid);
  const unlocked = remaining === 0;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const owner = process.env.ORDER_NOTIFY_EMAIL || "abdoulsabouragoro@gmail.com";
  const french = pass.locale !== "en";

  const customerText = unlocked
    ? french
      ? `Ton pass pour le lancement officiel est débloqué.\nCode : ${pass.code}\nTenue : ${outfitName}, taille ${pass.size}.\nLe QR est joint à cet email. Montre-le à l'entrée.`
      : `Your pass for the official launch is unlocked.\nCode: ${pass.code}\nOutfit: ${outfitName}, size ${pass.size}.\nThe QR code is attached. Show it at the door.`
    : french
      ? `Tu as payé ${pass.paid} F CFA. Il reste ${remaining} F CFA pour débloquer le pass du lancement officiel.\nCode : ${pass.code}\nTenue : ${outfitName}, taille ${pass.size}.\nGarde ce code : tu le ressaisis pour le prochain paiement.`
      : `You paid ${pass.paid} F CFA. ${remaining} F CFA remain to unlock the official launch pass.\nCode: ${pass.code}\nOutfit: ${outfitName}, size ${pass.size}.\nKeep this code and enter it for the next payment.`;

  const qr = unlocked ? await QRCode.toBuffer(passQrPayload(pass.code), { width: 480, margin: 1 }) : null;

  await mailer.sendMail({
    from,
    to: pass.email,
    subject: unlocked ? (french ? "Ton pass — lancement officiel" : "Your official launch pass") : french ? "Ton code TRUE" : "Your TRUE code",
    text: customerText,
    attachments: qr ? [{ filename: "pass-true.png", content: qr, contentType: "image/png" }] : [],
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
