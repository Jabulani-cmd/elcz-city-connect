// Who is issuing the receipts. One place, used by the emailed receipt, the PDF and the on-screen receipt.
// Anything left empty ("" or []) is simply left off the receipt, so no placeholder text ever shows up on a customer's receipt.
// The seller details below are the registered business's letterhead; add a VAT number once there is one.

export type Company = {
  /** Brand shown in the receipt's header, next to the logo. */
  name: string;
  /** The registered business that issues the receipt (named in the footer, next to the registration numbers). */
  legalName: string;
  product: string;
  tagline: string;
  addressLines: string[]; // e.g. ["12 Example Road", "Harare, Zimbabwe"]
  phone: string;
  email: string;
  website: string; // shown as text, without https://
  registration: string; // company registration number
  tin: string; // ZIMRA tax identification number
  vatNumber: string; // leave empty if not VAT registered
  /** Public address of the logo for emails (email programs can't use files from the app itself). */
  logoUrl: string;
  /** Brand colours (hex) used in the emailed receipt and the PDF. */
  brand: string;
  brandDark: string;
  accent: string;
};

export const COMPANY: Company = {
  name: "Kurima Digital",
  legalName: "MavingTech Business Solutions",
  product: "FarmHelper",
  tagline: "Empowering Zimbabwean farmers",
  addressLines: ["14601 Isiliwane Crescent, Selbourne Park", "Bulawayo, Zimbabwe"],
  phone: "+263 78 982 4741",
  email: "info@mavingtech.com",
  website: "www.mavingtech.com",
  registration: "115409A0252026",
  tin: "2002517356",
  vatNumber: "", // not given yet – add it here once known and it appears on every receipt
  logoUrl: "https://www.kurima-mavingtech.online/icon-192.png",
  brand: "#1f7a3a",
  brandDark: "#14532d",
  accent: "#e9a31a",
};

/** The lines of the "from" block, skipping anything that is empty. */
export function companyLines(c: Company = COMPANY): string[] {
  return [
    ...c.addressLines.filter(Boolean),
    [c.phone && `Tel / WhatsApp: ${c.phone}`, c.email].filter(Boolean).join("   ·   "),
    c.website,
    [c.registration && `Company Reg No: ${c.registration}`, c.tin && `ZIMRA TIN: ${c.tin}`, c.vatNumber && `VAT No: ${c.vatNumber}`].filter(Boolean).join("   ·   "),
  ].filter(Boolean);
}
