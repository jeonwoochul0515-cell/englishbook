import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ReadEasy AI - English Reading Companion",
  description: "AI-powered English book reader for language learners",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <main className="pb-20 min-h-screen bg-cream">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
