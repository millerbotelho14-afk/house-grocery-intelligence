import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ShellHeader } from "@/components/ShellHeader";

export const metadata = {
  title: "House Grocery Intelligence",
  description: "MVP para historico de precos, compras e insights de supermercado"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <main className="shell">
            <ShellHeader />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
