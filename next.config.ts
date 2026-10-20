import type { NextConfig } from "next";

// Visuels téléversés dans le dashboard : hôte déduit de PP_API_URL / PP_MEDIA_HOSTS,
// jamais écrit en dur — sinon ça marche en local et casse en prod.
const hosts = [process.env.PP_API_URL, ...(process.env.PP_MEDIA_HOSTS ?? "").split(",")]
  .filter(Boolean)
  .map((u) => { try { return new URL(u as string); } catch { return null; } })
  .filter((u): u is URL => u !== null);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: hosts.map((u) => ({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, port: u.port || undefined, pathname: "/media/**" })),
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
