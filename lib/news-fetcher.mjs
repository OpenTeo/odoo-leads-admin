const SOURCES = [
  { key: "reddit",     url: "https://www.reddit.com/r/Odoo/hot/.rss?limit=25",    lang: "en", max: 15 },
  { key: "reddit_fr",  url: "https://www.reddit.com/r/odoo_fr/hot/.rss?limit=15", lang: "fr", max: 10 },
  { key: "odoo_forum", url: "https://www.odoo.com/forum/help-1/rss",              lang: "en", max: 10 }
];

const FR_WORDS = new Set(["est","les","des","pour","avec","dans","sur","par","que","qui","pas","vous","nous","votre","notre","une","mais","son","ses","leur","leurs","cette","tout","plus","aussi","même","peut","fait"]);

const BOOST_KEYWORDS  = ["odoo 18","odoo 19","release","update","version","nouveauté","new feature","nouveautés"];
const BOOST_MINOR     = ["pme","sme","implementation","partner","migration","erp","partenaire","implémentation"];
const MODULES         = ["crm","pos","inventory","accounting","manufacturing","facturation","achat","vente","stock"];
const PENALTY_JOB     = ["job","hiring","emploi","poste","cdi","cdd","offre d'emploi","recrut"];
const PENALTY_SUPPORT = ["help","issue","error","bug","can't","cannot","n'arrive pas","problème","doesn't work","not working"];

function stripHtml(html) {
  let s = html || "";
  s = s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#32;/g," ");
  s = s.replace(/<!--[\s\S]*?-->/g," ").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ");
  s = s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#32;/g," ").replace(/&#\d+;/g," ").replace(/&[a-z]+;/g," ");
  return s.replace(/\s+/g," ").trim();
}

function detectLang(title, desc, sourceLangHint) {
  const text = ((title || "") + " " + (desc || "")).toLowerCase();
  const words = text.split(/\W+/).filter(Boolean);
  const frCount = words.filter(w => FR_WORDS.has(w)).length;
  if (frCount >= 2) return "fr";
  if (sourceLangHint === "fr") return "fr";
  return "en";
}

function scoreItem(title, desc) {
  const t = (title || "").toLowerCase();
  const d = (desc || "").toLowerCase();
  const combined = t + " " + d;

  let score = 5;

  if (BOOST_KEYWORDS.some(k => combined.includes(k))) score += 2;
  if (BOOST_MINOR.some(k => combined.includes(k))) score += 1;
  if (MODULES.some(k => combined.includes(k))) score += 1;
  if (PENALTY_JOB.some(k => combined.includes(k))) score -= 2;
  if (PENALTY_SUPPORT.some(k => combined.includes(k))) score -= 2;
  if ((desc || "").length < 60) score -= 1;

  return Math.max(0, Math.min(10, score));
}

function parseAtomFeed(xml, sourceKey, sourceLangHint) {
  const items = [];
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const block = match[1];
    const get = (tag) => { const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block); return m ? m[1].trim() : ""; };
    const title = stripHtml(get("title"));
    const linkMatch = /<link[^>]+href="([^"]+)"/.exec(block);
    const link = linkMatch ? linkMatch[1] : "";
    const rawContent = stripHtml(get("content")).trim();
    const isLinkOnly = !rawContent || rawContent.length < 40 || rawContent.toLowerCase().startsWith("submitted by");
    const desc = isLinkOnly ? null : rawContent.slice(0, 300);
    const updated = get("updated");

    if (title && link && !link.includes("/user/") && desc) {
      const score = scoreItem(title, desc);
      const lang = detectLang(title, desc, sourceLangHint);
      items.push({ title, link, desc, pubDate: updated, source: sourceKey, lang, score });
    }
  }
  return items;
}

function parseRssFeed(xml, sourceKey, sourceLangHint) {
  const items = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = match[1];
    const get = (tag) => { const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block); return m ? m[1].trim() : ""; };
    const title = stripHtml(get("title"));
    const link = get("link").trim();
    const rawDesc = stripHtml(get("description")).trim();
    const desc = rawDesc.length >= 40 ? rawDesc.slice(0, 300) : null;
    const pubDate = get("pubDate");

    if (title && link && desc) {
      const score = scoreItem(title, desc);
      const lang = detectLang(title, desc, sourceLangHint);
      items.push({ title, link, desc, pubDate, source: sourceKey, lang, score });
    }
  }
  return items;
}

async function fetchSource({ key, url, lang: langHint, max }) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "odoo-leads-admin/1.0" }
    });
    if (!res.ok) {
      console.log(`[news] ${key}: HTTP ${res.status} — skip`);
      return [];
    }
    const xml = await res.text();
    const isAtom = xml.includes("<entry>");
    const items = isAtom
      ? parseAtomFeed(xml, key, langHint)
      : parseRssFeed(xml, key, langHint);
    console.log(`[news] ${key}: ${items.length} articles parsed`);
    return items.slice(0, max);
  } catch (err) {
    console.log(`[news] ${key}: fetch error — ${err.message}`);
    return [];
  }
}

export async function fetchAllSources() {
  const results = await Promise.all(SOURCES.map(fetchSource));
  const allItems = results.flat();

  const qualified = allItems.filter(item => item.score >= 4);

  qualified.sort((a, b) => b.score - a.score);

  const seen = new Set();
  const deduped = [];
  for (const item of qualified) {
    const key = item.link;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped.slice(0, 8);
}
