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
      <body className="font-body antialiased overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
