import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  serverExternalPackages: ["stripe"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Boutique mise en pause : seules l'accueil et la réservation sont publiques.
  async redirects() {
    return [
      { source: "/shop", destination: "/", permanent: false },
      { source: "/produit/:slug*", destination: "/", permanent: false },
      { source: "/panier", destination: "/", permanent: false },
      { source: "/panier/succes", destination: "/", permanent: false },
      { source: "/compte", destination: "/", permanent: false },
      { source: "/livraison", destination: "/", permanent: false },
      { source: "/a-propos", destination: "/", permanent: false },
      { source: "/contact", destination: "/", permanent: false },
      { source: "/evenements", destination: "/", permanent: false },
      { source: "/evenements/pass", destination: "/reservation", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.fedapay.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self' https://cdn.fedapay.com https://checkout.fedapay.com https://api.fedapay.com",
            "frame-src https://checkout.fedapay.com https://*.fedapay.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self' https://checkout.fedapay.com",
          ].join("; ") },
        ],
      },
    ];
  },
};

export default nextConfig;
