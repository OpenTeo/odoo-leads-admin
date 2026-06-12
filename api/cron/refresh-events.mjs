import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const eventsPath = path.join(projectRoot, "data/events.json");

async function loadEvents() {
  try {
    const { readFileSync } = await import("node:fs");
    return JSON.parse(readFileSync(eventsPath, "utf8"));
  } catch {
    return [];
  }
}

async function checkEventUrls() {
  const events = await loadEvents();
  if (!events.length) return { checked: 0, active: 0, total: 0 };

  console.log(`[cron/refresh-events] checking ${events.length} URLs...`);
  const results = {};
  let checked = 0;

  for (const event of events) {
    if (!event.sourceUrl) continue;
    try {
      const r = await fetch(event.sourceUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "odoo-leads-admin/1.0" },
        redirect: "follow"
      });
      results[event.id] = { ok: r.ok || r.status === 405, code: r.status, checkedAt: new Date().toISOString() };
    } catch {
      results[event.id] = { ok: false, code: 0, checkedAt: new Date().toISOString() };
    }
    checked++;
    // Rate-limit to avoid hammering event sites
    await new Promise(r => setTimeout(r, 1200));
  }

  const active = Object.values(results).filter(s => s.ok).length;
  // Results are returned in the response and visible in Vercel Function Logs
  return { checked, active, total: events.length, results };
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const result = await checkEventUrls();
    console.log(`[cron/refresh-events] done: ${result.active}/${result.total} active`);
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/refresh-events] error:", err.message);
    res.status(500).json({ error: "check_failed", detail: err.message });
  }
}
