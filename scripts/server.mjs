import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { collectDashboardData, distPath, projectRoot, saveProspectFeedback, veilleNewsCachePath, eventsPath, eventsStatusCachePath } from "../lib/dashboard-data.mjs";
import { shouldConsolidate, runMonthlyConsolidation } from "../lib/monthly-consolidation.mjs";
import { buildHtml } from "../lib/dashboard-template.mjs";
import { pushProspectToOdoo } from "../lib/odoo-push.mjs";

const host = "127.0.0.1";
const port = 4311;
// Note: le blog officiel Odoo n'expose plus de flux RSS (toutes les URLs /rss retournent 404)
// Source principale : Reddit r/Odoo (hot)
const REDDIT_HOT_RSS_URL = "https://www.reddit.com/r/Odoo/hot/.rss?limit=25";
const NEWS_REFRESH_MS = 6 * 60 * 60 * 1000; // 6 heures

// ─── Actualités Odoo ──────────────────────────────────────────────────────────

function stripHtml(html) {
  let s = (html || "");
  // Reddit double-encode le HTML — décoder les entités avant de stripper
  s = s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#32;/g," ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  s = s.replace(/<[^>]+>/g, " ");
  // Décoder le reste des entités restantes
  s = s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#32;/g," ").replace(/&#\d+;/g," ").replace(/&[a-z]+;/g," ");
  return s.replace(/\s+/g, " ").trim();
}

async function fetchFromUrl(url, parseItems) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "odoo-leads-admin/1.0" } });
    if (!res.ok) return null;
    return parseItems(await res.text());
  } catch {
    return null;
  }
}


function parseRedditAtom(xml) {
  const items = [];
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const block = match[1];
    const get = (tag) => { const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block); return m ? m[1].trim() : ""; };
    const title = stripHtml(get("title"));
    const linkMatch = /<link[^>]+href="([^"]+)"/.exec(block);
    const link = linkMatch ? linkMatch[1] : "";
    const raw = stripHtml(get("content")).trim();
    // Ignorer les posts sans contenu (juste "submitted by ...")
    const isLinkOnly = !raw || raw.length < 40 || raw.toLowerCase().startsWith("submitted by");
    const desc = isLinkOnly ? null : raw.slice(0, 220);
    const updated = get("updated");
    if (title && link && !link.includes("/user/") && desc) {
      items.push({ title, link, desc, pubDate: updated, source: "reddit" });
    }
    if (items.length >= 6) break;
  }
  return items.length ? items : null;
}

async function fetchOdooNews() {
  // Blog officiel Odoo : pas de flux RSS disponible (404 sur toutes les URLs /rss)
  // Source unique fiable : Reddit r/Odoo hot
  return await fetchFromUrl(REDDIT_HOT_RSS_URL, parseRedditAtom);
}

async function refreshNewsCache() {
  const items = await fetchOdooNews();
  if (!items) {
    console.log("[news] Toutes les sources RSS indisponibles — cache inchangé");
    return false;
  }
  const cache = { fetchedAt: new Date().toISOString(), items };
  fs.mkdirSync(path.dirname(veilleNewsCachePath), { recursive: true });
  fs.writeFileSync(veilleNewsCachePath, JSON.stringify(cache, null, 2), "utf8");
  const source = items[0]?.source === "blog" ? "blog Odoo" : "Reddit r/Odoo (hot)";
  console.log(`[news] ${items.length} articles mis à jour depuis ${source}`);
  return true;
}

// ─── Vérification URLs des événements ────────────────────────────────────────

const EVENT_URL_CHECK_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

async function checkEventUrls() {
  let events = [];
  try {
    events = JSON.parse(fs.readFileSync(eventsPath, "utf8"));
  } catch {
    return;
  }

  const status = {};
  try {
    const existing = JSON.parse(fs.readFileSync(eventsStatusCachePath, "utf8"));
    Object.assign(status, existing);
  } catch { /* pas de cache existant */ }

  console.log(`[events] Vérification de ${events.length} URLs...`);
  for (const event of events) {
    if (!event.sourceUrl) continue;
    try {
      const r = await fetch(event.sourceUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "odoo-leads-admin/1.0" },
        redirect: "follow"
      });
      status[event.id] = { ok: r.ok || r.status === 405, code: r.status, checkedAt: new Date().toISOString() };
    } catch {
      status[event.id] = { ok: false, code: 0, checkedAt: new Date().toISOString() };
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  fs.mkdirSync(path.dirname(eventsStatusCachePath), { recursive: true });
  fs.writeFileSync(eventsStatusCachePath, JSON.stringify(status, null, 2), "utf8");
  const ok = Object.values(status).filter((s) => s.ok).length;
  console.log(`[events] URLs vérifiées: ${ok}/${events.length} actives`);
}

// Fetch initial au démarrage (sans bloquer le serveur)
refreshNewsCache().catch(() => {});

// Refresh toutes les 6h
setInterval(() => refreshNewsCache().catch(() => {}), NEWS_REFRESH_MS);

// Vérification URLs événements 30s après démarrage puis toutes les semaines
setTimeout(() => checkEventUrls().catch(() => {}), 30_000);
setInterval(() => checkEventUrls().catch(() => {}), EVENT_URL_CHECK_MS);

// ─── Consolidation mensuelle ──────────────────────────────────────────────────

function runMonthlyIfNeeded() {
  try {
    if (shouldConsolidate()) {
      runMonthlyConsolidation();
    }
  } catch (err) {
    console.error("[monthly] Erreur:", err.message);
  }
}

// Vérifier au démarrage
runMonthlyIfNeeded();

// Vérifier chaque nuit à minuit
function scheduleNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0);
  const msUntilMidnight = nextMidnight.getTime() - now.getTime();
  setTimeout(() => {
    runMonthlyIfNeeded();
    scheduleNextMidnight();
  }, msUntilMidnight);
}
scheduleNextMidnight();

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, code, detail) {
  sendJson(response, statusCode, { error: code, detail });
}

function sendHtml(response, html) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(html);
}

function notFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

// ─── Serveur ──────────────────────────────────────────────────────────────────

const serverStartedAt = new Date().toISOString();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);

  try {
    // Santé du serveur
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, {
        status: "ok",
        uptime: Math.round(process.uptime()),
        startedAt: serverStartedAt,
        now: new Date().toISOString()
      });
      return;
    }

    // Données du dashboard
    if (request.method === "GET" && url.pathname === "/api/dashboard-data") {
      sendJson(response, 200, collectDashboardData());
      return;
    }

    // Refresh manuel: force RSS + renvoie données fraîches
    if (request.method === "POST" && url.pathname === "/api/refresh") {
      await refreshNewsCache();
      sendJson(response, 200, collectDashboardData());
      return;
    }

    // Feedback prospect (route legacy)
    if (request.method === "POST" && /^\/api\/prospects\/[^/]+\/feedback$/.test(url.pathname)) {
      const id = decodeURIComponent(url.pathname.split("/")[3]);
      const body = await readBody(request);
      sendJson(response, 200, saveProspectFeedback(id, body));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/prospect-feedback") {
      const id = decodeURIComponent(url.searchParams.get("id") || "");
      const body = await readBody(request);
      sendJson(response, 200, saveProspectFeedback(id, body));
      return;
    }

    // Push prospect vers Odoo CRM
    if (request.method === "POST" && url.pathname === "/api/push-to-odoo") {
      const id = decodeURIComponent(url.searchParams.get("id") || "");
      if (!id) { sendError(response, 400, "missing_id", "Paramètre id manquant"); return; }
      const body = await readBody(request);
      const data = collectDashboardData();
      const prospect = data.prospects.find((p) => p.id === id);
      if (!prospect) { sendError(response, 404, "prospect_not_found", "Prospect introuvable"); return; }
      const { leadId } = await pushProspectToOdoo(prospect, body);
      sendJson(response, 200, { success: true, leadId, name: prospect.name });
      return;
    }

    // Page principale
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const html = buildHtml(collectDashboardData());
      fs.mkdirSync(path.dirname(distPath), { recursive: true });
      fs.writeFileSync(distPath, html, "utf8");
      sendHtml(response, html);
      return;
    }

    notFound(response);
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendError(response, 400, "invalid_json", error.message);
      return;
    }
    const statusCode = error?.statusCode ?? 500;
    sendError(response, statusCode, statusCode === 500 ? "server_error" : "request_error", error instanceof Error ? error.message : String(error));
  }
});

server.listen(port, host, () => {
  console.log(`Odoo Leads Admin running on http://${host}:${port}`);
  console.log(`Project root: ${projectRoot}`);
  console.log(`Démarré à: ${serverStartedAt}`);
});
