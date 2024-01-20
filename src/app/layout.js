import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "500", "700"] });

export const metadata = {
  title: "REBELDE",
  description: "Next.js, react-three/fiber, shaders, gsap | by FANTAZ",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
