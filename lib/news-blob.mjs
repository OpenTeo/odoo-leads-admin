import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LOCAL_CACHE_PATH = path.join(projectRoot, "data/veille-news-cache.json");
const BLOB_KEY = "veille-news-cache.json";

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readNewsCache() {
  if (hasBlobToken()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: BLOB_KEY });
      const match = blobs.find(b => b.pathname === BLOB_KEY);
      if (match) {
        const res = await fetch(match.url);
        if (res.ok) {
          return await res.json();
        }
      }
    } catch (err) {
      console.log(`[blob] readNewsCache error: ${err.message} — falling back to file`);
    }
  }

  try {
    if (fs.existsSync(LOCAL_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_CACHE_PATH, "utf8"));
    }
  } catch { /* ignore */ }

  return null;
}

export function readNewsCacheSync() {
  try {
    if (fs.existsSync(LOCAL_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_CACHE_PATH, "utf8"));
    }
  } catch { /* ignore */ }
  return null;
}

export async function writeNewsCache(data) {
  const json = JSON.stringify(data, null, 2);

  if (hasBlobToken()) {
    try {
      const { put } = await import("@vercel/blob");
      await put(BLOB_KEY, json, { access: "public", addRandomSuffix: false });
      console.log(`[blob] writeNewsCache: ${data.items?.length ?? 0} items written to blob`);
      return;
    } catch (err) {
      console.log(`[blob] writeNewsCache error: ${err.message} — falling back to file`);
    }
  }

  fs.mkdirSync(path.dirname(LOCAL_CACHE_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_CACHE_PATH, json, "utf8");
  console.log(`[blob] writeNewsCache: ${data.items?.length ?? 0} items written to file`);
}
