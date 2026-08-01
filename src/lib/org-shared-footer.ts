import type { CSSProperties } from "react";
import { contrastingTextColor } from "@/lib/color-contrast";

/** DOM id on the public org/facility footer — used by the sticky Refer CTA blend. */
export const ORG_SHARED_FOOTER_ID = "org-shared-footer";

/** Mount point for the Refer Patient footer action (dock target). */
export const ORG_FOOTER_REFER_SLOT_ID = "org-footer-refer-slot";

/** Shared opener so footer + sticky CTA open the same contact sheet. */
let referPatientOpener: (() => void) | null = null;

export function registerReferPatientOpener(open: (() => void) | null) {
  referPatientOpener = open;
}

export function openReferPatientSheet() {
  referPatientOpener?.();
}

/** Equal-size footer action pills (Share / Export / View More / Refer). */
export const FOOTER_ACTION_BTN_CLASS =
  "inline-flex h-10 w-[9.75rem] shrink-0 items-center justify-center gap-1.5 rounded-lg " +
  "text-sm font-semibold tracking-wide border " +
  "transition-all duration-200 ease-out " +
  "hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export const FOOTER_ACTION_ICON_CLASS = "h-3.5 w-3.5 shrink-0";

export function footerActionButtonStyle(brand: string): CSSProperties {
  const text = contrastingTextColor(brand);
  const lightOnBrand = text === "#ffffff";
  return lightOnBrand
    ? {
        backgroundColor: "#ffffff",
        borderColor: "rgba(255,255,255,0.9)",
        color: "#0f172a",
        ["--tw-ring-color" as string]: "rgba(255,255,255,0.7)",
      }
    : {
        backgroundColor: "#0f172a",
        borderColor: "rgba(15,23,42,0.9)",
        color: "#ffffff",
        ["--tw-ring-color" as string]: "rgba(15,23,42,0.45)",
      };
}