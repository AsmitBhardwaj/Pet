import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pixel/bitmap display font — headings, nav logo, and button labels only.
const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

export const metadata = {
  title: "Dodo — your pet, on your desktop",
  description:
    "Upload a photo of your pet and get a personalized pixel-art desktop companion that lives on your screen and reacts to you. Free, private, runs in your browser.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* CRT texture overlays — pointer-events:none, never block clicks. */}
        <div className="crt-scanlines" aria-hidden="true" />
        <div className="crt-vignette" aria-hidden="true" />
      </body>
    </html>
  );
}
