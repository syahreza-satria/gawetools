import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GaweTools",
    short_name: "GaweTools",
    description: "Alat PDF dan gambar yang berjalan 100% di browser Anda, tanpa upload ke server.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    lang: "id",
    categories: ["productivity", "utilities"],
    // Next's Manifest type models `files` as a single File; the Web Share Target spec wants an array of descriptors.
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [{ name: "files", accept: ["application/pdf", "image/*", ".pdf"] }],
      },
    } as unknown as MetadataRoute.Manifest["share_target"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
