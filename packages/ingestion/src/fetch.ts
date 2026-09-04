import { createDb, dueSources } from "@ri/db";
import { fetchSource, FileSnapshotStore, PoliteFetcher } from "./worker.js";

export async function runFetchPass(dryRun = false): Promise<void> {
  const { db, close } = createDb();
  const now = new Date();
  try {
    const due = await dueSources(db, now.toISOString());
    console.log(`${due.length} source(s) due at ${now.toISOString()}`);
    const fetcher = new PoliteFetcher();
    const store = new FileSnapshotStore();
    for (const source of due) {
      if (dryRun) {
        console.log(`${source.id}\t${source.refreshCadence}\t${source.url}`);
        continue;
      }
      try {
        const result = await fetchSource(db, source, fetcher, store, now);
        console.log(`${source.id}\t${result.changed ? "changed" : "unchanged"}\t${source.url}`);
      } catch (error) {
        console.error(`${source.id}\tskipped\t${source.url}\t${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    await close();
  }
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  runFetchPass(process.argv.includes("--dry-run")).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
