import { list } from "@vercel/blob";

const PROSPECTS_BLOB_KEY = "odoo-leads-admin/prospects-latest.json";

function formatProspect(p, index) {
  const score = p.rawScore != null ? `${Number(p.rawScore).toFixed(1)}/10` : "—";
  const sector = p.sector || "—";
  const owner = p.owner ? ` (${p.owner})` : "";
  const lines = [
    `**${index + 1}. ${p.name}**${owner} — ${score}`,
    `   Secteur : ${sector}`,
  ];
  if (p.angle) lines.push(`   Angle : ${p.angle}`);
  return lines.join("\n");
}

function buildDiscordPayload(prospects) {
  const date = new Date().toLocaleDateString("fr-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const header = `📋 **Leads Odoo — semaine du ${date}** (${prospects.length} prospects)\n`;
  const body = prospects
    .slice(0, 20)
    .map((p, i) => formatProspect(p, i))
    .join("\n\n");
  return { content: `${header}\n${body}` };
}

async function readProspectsFromBlob() {
  const { blobs } = await list({
    prefix: "odoo-leads-admin/",
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
  const blob = blobs.find((b) => b.pathname === PROSPECTS_BLOB_KEY);
  if (!blob) return null;

  const resp = await fetch(blob.url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`blob fetch failed: ${resp.status}`);
  return resp.json();
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "missing_blob_token" });
  }

  let prospects;
  try {
    prospects = await readProspectsFromBlob();
  } catch (err) {
    console.error("[cron/send-leads] blob read error:", err.message);
    return res.status(500).json({ error: "blob_read_failed", detail: err.message });
  }

  if (!prospects) {
    console.warn("[cron/send-leads] blob not found:", PROSPECTS_BLOB_KEY);
    return res.status(200).json({ sent: false, reason: "no_blob" });
  }

  if (!Array.isArray(prospects)) {
    return res.status(500).json({ error: "invalid_blob_content" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.OPENCLAW_WEBHOOK_URL;

  if (!webhookUrl) {
    // TODO: set DISCORD_WEBHOOK_URL or OPENCLAW_WEBHOOK_URL in Vercel env vars to enable delivery
    console.log(`[cron/send-leads] no webhook — ${prospects.length} prospects ready, not sent`);
    return res.status(200).json({ sent: false, count: prospects.length, reason: "no_webhook" });
  }

  try {
    const payload = buildDiscordPayload(prospects);
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      throw new Error(`webhook ${webhookRes.status}: ${text}`);
    }

    console.log(`[cron/send-leads] sent ${prospects.length} prospects`);
    return res.status(200).json({ sent: true, count: prospects.length });
  } catch (err) {
    console.error("[cron/send-leads] webhook error:", err.message);
    return res.status(500).json({ error: "webhook_failed", detail: err.message });
  }
}
