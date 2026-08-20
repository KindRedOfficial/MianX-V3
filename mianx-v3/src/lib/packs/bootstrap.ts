/**
 * Bootstrap file — call `loadAllPacks()` once at app startup
 * (e.g., in a top-level layout or instrumentation file).
 *
 * Importing this module triggers pack registration into the
 * in-memory registry. Each pack file exports a single `load*Pack()`
 * function that calls `registerDomainPack` / `registerCountryPack`.
 */

import { loadPoultryPack } from "./poultry.domain";
import { loadPakistanPack } from "./pakistan.country";

let loaded = false;

export function loadAllPacks(): void {
  if (loaded) return;
  loaded = true;

  // Domain packs
  loadPoultryPack();

  // Country packs
  loadPakistanPack();

  console.log("[PACKS] All packs loaded into registry");
}
