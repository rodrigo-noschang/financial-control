import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Controle Financeiro",
    short_name: "Financeiro",
    description: "Controle pessoal de despesas",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#171b24",
    theme_color: "#171b24",
    lang: "pt-BR",
    orientation: "any",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
