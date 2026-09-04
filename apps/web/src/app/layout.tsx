import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NavRail } from "@/components/nav";
import { CommandPaletteProvider } from "@/components/command-palette";
import { EvidenceStoreProvider } from "@/components/evidence/evidence-store";
import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Robotics Intelligence", template: "%s · Robotics Intelligence" },
  description:
    "How robotics fits together — the machines, the stacks inside them, and the markets buying them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <CommandPaletteProvider>
          <EvidenceStoreProvider>
            <div className="flex min-h-dvh flex-col lg:flex-row">
              <NavRail />
              <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-[22px]">{children}</main>
            </div>
            <EvidenceDrawer />
          </EvidenceStoreProvider>
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
