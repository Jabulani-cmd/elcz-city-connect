// Who is issuing the receipts. One place, used by the emailed receipt, the PDF and the on-screen receipt.
// Anything left empty ("" or []) is simply left off the receipt, so no placeholder text ever shows up on a customer's receipt.
// Fill in the address, email and registration/VAT numbers below to make the receipt a complete official document.

export type Company = {
  name: string;
  product: string;
  tagline: string;
  addressLines: string[]; // e.g. ["12 Example Road", "Harare, Zimbabwe"]
  phone: string;
  email: string;
  website: string; // shown as text, without https://
  registration: string; // company registration / TIN number
  vatNumber: string;
  /** Public address of the logo for emails (email programs can't use files from the app itself). */
  logoUrl: string;
  /** Brand colours (hex) used in the emailed receipt and the PDF. */
  brand: string;
  brandDark: string;
  accent: string;
};

export const COMPANY: Company = {
  name: "Kurima Digital",
  product: "FarmHelper",
  tagline: "Empowering Zimbabwean farmers",
  addressLines: [],
  phone: "+263 78 982 4741",
  email: "",
  website: "www.kurima-mavingtech.online",
  registration: "",
  vatNumber: "",
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
    [c.registration && `Reg / TIN: ${c.registration}`, c.vatNumber && `VAT No: ${c.vatNumber}`].filter(Boolean).join("   ·   "),
  ].filter(Boolean);
}
