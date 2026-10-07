import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GaweTools",
    short_name: "GaweTools",
    description: "Alat PDF dan gambar yang berjalan 100% di browser Anda, tanpa upload ke server.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#0ea5e9",
    lang: "id",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
