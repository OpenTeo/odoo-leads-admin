import { fetchAllSources } from "../../lib/news-fetcher.mjs";
import { writeNewsCache } from "../../lib/news-blob.mjs";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const items = await fetchAllSources();
    const cache = {
      fetchedAt: new Date().toISOString(),
      items,
      sources: [...new Set(items.map(i => i.source))],
      version: 2
    };
    await writeNewsCache(cache);
    console.log(`[cron/refresh-news] done: ${items.length} articles`);
    res.status(200).json({ ok: true, count: items.length, sources: cache.sources });
  } catch (err) {
    console.error("[cron/refresh-news] error:", err.message);
    res.status(500).json({ error: "refresh_failed", detail: err.message });
  }
}
