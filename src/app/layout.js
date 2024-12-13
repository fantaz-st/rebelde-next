import { Inter } from "next/font/google";
import "./globals.css";
import RegisterGSAP from "@/components/RegisterGsap";

const inter = Inter({ subsets: ["latin"], weight: ["300", "500", "700"] });

export const metadata = {
  title: "REBELDE",
  description: "Welcome to REBELDE, your gateway to breathtaking adventures in the Croatian Blue Cave and Blue Lagoon, where every private boat tour promises unforgettable moments on the Adriatic Sea.",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <RegisterGSAP />
        {children}
      </body>
    </html>
  );
}
