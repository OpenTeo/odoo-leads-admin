import fs from "node:fs";
import path from "node:path";
import { collectDashboardData, distPath, publicPath, veilleNewsCachePath } from "../lib/dashboard-data.mjs";
import { buildHtml } from "../lib/dashboard-template.mjs";

const ODOO_BLOG_RSS_URL = "https://www.odoo.com/blog/all-1/rss";
const REDDIT_HOT_RSS_URL = "https://www.reddit.com/r/Odoo/hot/.rss?limit=25";

function stripHtml(html) {
  let s = (html || "");
  s = s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#32;/g," ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ");
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

function parseOdooBlogRss(xml) {
  const items = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = match[1];
    const get = (tag) => { const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block); return m ? m[1].trim() : ""; };
    const title = stripHtml(get("title"));
    const link = stripHtml(get("link")).trim();
    const desc = stripHtml(get("description")).slice(0, 220);
    const pubDate = get("pubDate");
    if (title && link) items.push({ title, link, desc: desc || "Article du blog Odoo.", pubDate, source: "blog" });
    if (items.length >= 6) break;
  }
  return items.length ? items : null;
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

async function refreshNewsCache() {
  const blogItems = await fetchFromUrl(ODOO_BLOG_RSS_URL, parseOdooBlogRss);
  if (blogItems?.length) {
    const cache = { fetchedAt: new Date().toISOString(), items: blogItems };
    fs.mkdirSync(path.dirname(veilleNewsCachePath), { recursive: true });
    fs.writeFileSync(veilleNewsCachePath, JSON.stringify(cache, null, 2), "utf8");
    console.log(`[news] ${blogItems.length} articles depuis blog Odoo`);
    return;
  }
  const redditItems = await fetchFromUrl(REDDIT_HOT_RSS_URL, parseRedditAtom);
  if (redditItems?.length) {
    const cache = { fetchedAt: new Date().toISOString(), items: redditItems };
    fs.mkdirSync(path.dirname(veilleNewsCachePath), { recursive: true });
    fs.writeFileSync(veilleNewsCachePath, JSON.stringify(cache, null, 2), "utf8");
    console.log(`[news] ${redditItems.length} articles depuis Reddit r/Odoo (hot)`);
    return;
  }
  console.log("[news] Toutes les sources indisponibles — cache inchangé");
}

await refreshNewsCache();

const html = buildHtml(collectDashboardData());
fs.mkdirSync(path.dirname(distPath), { recursive: true });
fs.writeFileSync(distPath, html, "utf8");
fs.mkdirSync(path.dirname(publicPath), { recursive: true });
fs.writeFileSync(publicPath, html, "utf8");
console.log(`Dashboard genere: ${distPath}`);
