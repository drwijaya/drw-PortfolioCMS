"use client";
import { createContext, useContext, useEffect } from "react";
import { configureRouteOrder } from "@/lib/route-axis";
import { MENU } from "@/components/sidebar/nav-items";
import { configureTabs } from "@/lib/tab-memory";
export interface MenuItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  location: "main" | "footer";
}
const SiteConfigContext = createContext<{
  items: MenuItem[];
  analyticsEnabled: boolean;
  analyticsPublic: boolean;
}>({
  items: MENU.map((i) => ({
    id: i.tab,
    label: i.label,
    href: i.href,
    visible: true,
    location: "main",
  })),
  analyticsEnabled: true,
  analyticsPublic: true,
});
export function SiteConfig({
  items,
  analyticsEnabled = true,
  analyticsPublic = true,
  children,
}: {
  items: MenuItem[];
  analyticsEnabled?: boolean;
  analyticsPublic?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    configureRouteOrder(
      items
        .filter((i) => i.visible && i.location === "main")
        .map((i) => i.href),
    );
    configureTabs(
      items
        .filter((i) => i.visible && i.location === "main")
        .map((i) => ({ id: i.id, href: i.href })),
    );
  }, [items]);
  return (
    <SiteConfigContext.Provider
      value={{ items, analyticsEnabled, analyticsPublic }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}
export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
