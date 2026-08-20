import type { CountryPackManifest } from "./types";
import { registerCountryPack } from "./registry.service";

// ─── Manifest ───────────────────────────────────────────────────────────────

const PakistanManifest: CountryPackManifest = {
  id: "pk-v1",
  name: "Pakistan",
  locale: "en-PK",
  currency: "PKR",
  timezone: "Asia/Karachi",
  taxConfig: {
    taxRate: 0.16,
    taxName: "GST",
    taxId: "STRN",
    hasTaxExemptCategories: true,
    exemptCategories: ["unprocessed_poultry", "agricultural_input", "live_birds"],
  },
  paymentProviders: [
    {
      id: "jazzcash",
      name: "JazzCash",
      type: "mobile_wallet",
      supportedCurrencies: ["PKR"],
    },
    {
      id: "easypaisa",
      name: "Easypaisa",
      type: "mobile_wallet",
      supportedCurrencies: ["PKR"],
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer (IBFT)",
      type: "bank_transfer",
      supportedCurrencies: ["PKR"],
    },
    {
      id: "stripe",
      name: "Stripe (International)",
      type: "international",
      supportedCurrencies: ["PKR", "USD"],
    },
  ],
  complianceRules: [
    {
      id: "fbr_tax_filing",
      name: "FBR Tax Filing",
      description: "All revenue must be reported via STRN to FBR quarterly",
      regulatoryBody: "FBR",
      penalty: "PKR 50,000 fine or 2 years imprisonment",
    },
    {
      id: "pda_registration",
      name: "PDA Registration",
      description: "Poultry operations must be registered with the Provincial Dairy & Poultry Authority",
      regulatoryBody: "PDPA",
    },
    {
      id: "drug_regulation",
      name: "Veterinary Drug Regulation",
      description: "All medications must be sourced from DAPRA-licensed suppliers with withdrawal period tracking",
      regulatoryBody: "DAPRA",
      penalty: "Product confiscation and facility shutdown",
    },
  ],
};

// ─── Registration ───────────────────────────────────────────────────────────

export function loadPakistanPack(): void {
  registerCountryPack(PakistanManifest);
}
