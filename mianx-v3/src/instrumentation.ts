/**
 * Next.js instrumentation hook.
 * Runs once when the Next.js server starts.
 * Used here to bootstrap all domain/country packs into the in-memory registry.
 */

export async function register() {
  // Dynamic import to avoid bundling pack data into client chunks
  const { loadAllPacks } = await import("@/lib/packs/bootstrap");
  loadAllPacks();
}
