import type { Metadata } from "next";
import { Inter, Tajawal, Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import "./styles/chat.css";
import "./styles/location.css";
import "./styles/contact-end.css";
import "./styles/account.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import ChatWidget from "@/components/ChatWidget";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

// NEW — modern Latin (used in EN/FR)
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

// NEW — modern Arabic (used in AR)
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "المؤسسة العمومية الاستشفائية بنقاوس",
  description:
    "الموقع الرسمي للمؤسسة العمومية الاستشفائية بنقاوس، ولاية باتنة — الخدمات الطبية، المصالح، الأطباء، الأخبار وأخذ المواعيد.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${inter.variable} ${tajawal.variable} ${jakarta.variable} ${plexArabic.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="flex-1 site-main">{children}</main>
          <Footer />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
