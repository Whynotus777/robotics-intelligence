import "server-only";
import { createDataProvider, type DataProvider } from "@ri/fixtures";

/**
 * The single door to data. Screens never know whether the answer came from the
 * generated fixtures or from the API: DATA_PROVIDER=http swaps the implementation
 * and nothing above this module changes. Fixtures load lazily so the http mode
 * never pulls the generated JSON into the bundle.
 */
let cached: Promise<DataProvider> | undefined;

export function data(): Promise<DataProvider> {
  cached ??= (async () => {
    const mode = process.env.DATA_PROVIDER ?? "fixture";
    const fixtures =
      mode === "fixture"
        ? ((await import("@ri/fixtures/generated/index.json")).default as unknown as Record<string, unknown>)
        : {};
    return createDataProvider(fixtures, { mode });
  })();
  return cached;
}

/** A fixture (or API row) that is simply not there is a 404, never an error page. */
export async function orNotFound<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}
