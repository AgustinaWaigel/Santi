import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/aida-public/**" }],
  },
  // El formulario del admin envía las fotos por Server Action; el límite por defecto es 1 MB.
  // Entran hasta 8 fotos de 6 MB y un video de 40 MB.
  experimental: { serverActions: { bodySizeLimit: "100mb" } },
};

export default nextConfig;
