import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Gestor AI | Painel de Controle",
  description:
    "Plataforma de gestão de tarefas editorial com integração WhatsApp. Gerencie sua equipe e tarefas de forma eficiente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="font-body antialiased overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
