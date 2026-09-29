"use client";
import { useSiteConfig } from "./SiteConfig";
import { TransitionLink } from "@/components/navigation/RouteTransition";
import "./navigation.css";
export function ExtraNavigation() {
  const { items } = useSiteConfig(),
    extra = items.filter((i) => i.visible && i.location === "main").slice(4),
    footer = items.filter((i) => i.visible && i.location === "footer");
  return (
    <>
      {extra.length > 0 && (
        <nav className="cms-nav-overflow" aria-label="Halaman lainnya">
          {extra.map((i) => (
            <TransitionLink key={i.id} href={i.href}>
              {i.label}
            </TransitionLink>
          ))}
        </nav>
      )}
      {footer.length > 0 && (
        <nav className="cms-nav-footer" aria-label="Footer">
          {footer.map((i) => (
            <TransitionLink key={i.id} href={i.href}>
              {i.label}
            </TransitionLink>
          ))}
        </nav>
      )}
    </>
  );
}
