import sharp from "sharp";
import QRCode from "qrcode";
import { chemiseLabel } from "@/data/chemises";
import { passQrPayload } from "@/lib/pass-seal";
import type { Pass } from "@/lib/passes";

export async function generateTicketPng(pass: Pass): Promise<Buffer> {
  const outfitTitle = chemiseLabel(pass.outfit);
  const isUnlocked = pass.paid >= pass.total;

  const qrBuffer = await QRCode.toBuffer(passQrPayload(pass.code), {
    width: 280,
    margin: 1,
    color: { dark: "#09090b", light: "#fafaf9" },
  });

  const width = 800;
  const height = 1140;

  // Escape text for SVG safety
  const safeName = pass.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeOutfit = outfitTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const statusText = isUnlocked ? "PASS DÉBLOQUÉ · ENTRÉE OFFICIELLE" : `PASS EN COURS · ${pass.paid.toLocaleString("fr-FR")} / ${pass.total.toLocaleString("fr-FR")} F CFA`;
  const statusColor = isUnlocked ? "#22c55e" : "#eab308";

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d4af37"/>
        <stop offset="50%" stop-color="#f5e6b3"/>
        <stop offset="100%" stop-color="#aa7c11"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="#0a0a0c"/>
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="url(#gold)" stroke-width="2" rx="16"/>
    <rect x="36" y="36" width="${width - 72}" height="${height - 72}" fill="none" stroke="#222226" stroke-width="1" rx="10"/>

    <!-- Brand Header -->
    <text x="400" y="105" text-anchor="middle" font-family="'Cinzel', 'Playfair Display', serif, sans-serif" font-size="44" font-weight="bold" fill="url(#gold)" letter-spacing="8">T R U E</text>
    <text x="400" y="142" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#a1a1aa" letter-spacing="4">LANCEMENT OFFICIEL DE LA MARQUE</text>

    <!-- Status Badge -->
    <rect x="200" y="170" width="400" height="34" fill="#18181b" stroke="${statusColor}" stroke-width="1" rx="17"/>
    <text x="400" y="192" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="${statusColor}" letter-spacing="2">${statusText}</text>

    <line x1="80" y1="230" x2="720" y2="230" stroke="#27272a" stroke-width="1"/>

    <!-- Invité -->
    <text x="90" y="275" font-family="sans-serif" font-size="13" fill="#71717a" letter-spacing="2">INVITÉ(E)</text>
    <text x="90" y="315" font-family="sans-serif" font-size="28" font-weight="bold" fill="#f4f4f5">${safeName}</text>

    <!-- Tenue -->
    <text x="90" y="375" font-family="sans-serif" font-size="13" fill="#71717a" letter-spacing="2">TENUE RÉSERVÉE</text>
    <text x="90" y="410" font-family="sans-serif" font-size="20" fill="#f4f4f5">${safeOutfit}</text>
    <text x="90" y="442" font-family="sans-serif" font-size="16" fill="url(#gold)">Taille : ${pass.size}</text>

    <!-- Code Pass -->
    <text x="90" y="505" font-family="sans-serif" font-size="13" fill="#71717a" letter-spacing="2">CODE DU PASS</text>
    <text x="90" y="545" font-family="'Courier New', monospace" font-size="36" font-weight="bold" fill="url(#gold)" letter-spacing="6">${pass.code}</text>

    <!-- Date & Lieu -->
    <text x="90" y="605" font-family="sans-serif" font-size="13" fill="#71717a" letter-spacing="2">DATE &amp; LIEU</text>
    <text x="90" y="635" font-family="sans-serif" font-size="18" fill="#f4f4f5">03 Janvier 2026 · Lomé, Togo</text>

    <line x1="80" y1="680" x2="720" y2="680" stroke="#27272a" stroke-dasharray="6,6" stroke-width="1"/>

    <!-- Instructions QR -->
    <text x="400" y="730" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#a1a1aa" letter-spacing="3">PRÉSENTE CE QR CODE À L'ENTRÉE</text>
  </svg>
  `;

  return sharp(Buffer.from(svg))
    .composite([
      {
        input: qrBuffer,
        top: 770,
        left: 260,
      },
    ])
    .png()
    .toBuffer();
}
