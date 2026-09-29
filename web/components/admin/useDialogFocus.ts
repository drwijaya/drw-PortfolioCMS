"use client";
import { useEffect } from "react";
export function useDialogFocus() {
  useEffect(() => {
    let active: HTMLElement | null = null,
      previous: HTMLElement | null = null;
    const focusables = (node: HTMLElement) =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length > 0);
    const sync = () => {
      const dialogs = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.cms-dialog[aria-modal="true"]',
        ),
      );
      const next = dialogs.at(-1) ?? null;
      if (next === active) return;
      if (!active && next) previous = document.activeElement as HTMLElement;
      active = next;
      if (active) {
        active.tabIndex = -1;
        (focusables(active)[0] ?? active).focus();
      } else if (previous?.isConnected) previous.focus();
    };
    const key = (e: KeyboardEvent) => {
      if (!active) return;
      if (e.key === "Tab") {
        const items = focusables(active),
          first = items[0] ?? active,
          last = items.at(-1) ?? active;
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !active.contains(document.activeElement))
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            !active.contains(document.activeElement))
        ) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.key === "Escape") {
        const cancel = Array.from(active.querySelectorAll("button")).find((b) =>
          /^(Tutup|Batal)$/.test(b.textContent?.trim() ?? ""),
        );
        if (cancel) {
          e.preventDefault();
          cancel.click();
        }
      }
    };
    const focus = (e: FocusEvent) => {
      if (active && e.target instanceof Node && !active.contains(e.target))
        (focusables(active)[0] ?? active).focus();
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("keydown", key);
    document.addEventListener("focusin", focus);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", key);
      document.removeEventListener("focusin", focus);
    };
  }, []);
}
