const PROSPECTS_BLOB_KEY = "odoo-leads-admin/prospects-latest.json";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "missing_blob_token" });
  }

  // POST: import leads provided in the request body (called by OpenClaw prospect-hunter)
  if (req.method === "POST") {
    let leads;
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      leads = body?.leads;
    } catch {
      return res.status(400).json({ error: "invalid_json" });
    }

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: "missing_leads_array" });
    }

    try {
      const { put } = await import("@vercel/blob");
      await put(PROSPECTS_BLOB_KEY, JSON.stringify(leads, null, 2), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json; charset=utf-8",
        token: process.env.BLOB_READ_WRITE_TOKEN
      });

      console.log(`[generate-prospects] imported ${leads.length} prospects to blob`);
      return res.status(200).json({ ok: true, count: leads.length });
    } catch (err) {
      console.error("[generate-prospects] blob write error:", err.message);
      return res.status(500).json({ error: "blob_write_failed", detail: err.message });
    }
  }

  // GET (Vercel cron): generation is handled by OpenClaw — nothing to do here
  console.log("[generate-prospects] cron ping — generation handled by OpenClaw");
  return res.status(200).json({ ok: true, pending: true, reason: "generation_handled_by_openclaw" });
}
