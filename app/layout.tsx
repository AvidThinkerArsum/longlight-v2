import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { site } from "@/lib/site";
import { clockLabel } from "@/lib/sun";

const [h0, m0] = site.hours.start.split(":").map(Number);
const START = clockLabel(h0 * 60 + m0);
import "./globals.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${site.name} · A barn for weddings in ${site.town}, ${site.state}`,
  description: `${site.kind} in ${site.town}, ${site.state}. See which weekends are still free, what your day would cost, and how the light falls from ${START} to the sparklers.`,
};

export const viewport: Viewport = {
  themeColor: "#1e2340",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrument.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
