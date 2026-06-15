import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readOverridesPersistent, writeOverridesPersistent } from "./storage.mjs";
import { readNewsCacheSync, readNewsCache } from "./news-blob.mjs";

const currentFilePath = fileURLToPath(import.meta.url);
const libRoot = path.dirname(currentFilePath);
export const projectRoot = path.dirname(libRoot);
export const workspaceRoot = path.dirname(path.dirname(projectRoot));
export const bundledLeadsRoot = path.join(projectRoot, "snapshot/CLIENTS_01_LEADS");
export const leadsRoot = fs.existsSync(path.join(workspaceRoot, "CLIENTS/01_LEADS"))
  ? path.join(workspaceRoot, "CLIENTS/01_LEADS")
  : bundledLeadsRoot;

const PROSPECTS_BLOB_KEY = "odoo-leads-admin/prospects-latest.json";
export const distPath = path.join(projectRoot, "dist/index.html");
export const publicPath = path.join(projectRoot, "public/index.html");
export const automationsPath = path.join(projectRoot, "data/automations.json");
export const eventsPath = path.join(projectRoot, "data/events.json");
export const playbooksPath = path.join(projectRoot, "data/playbooks.json");
export const veillePath = path.join(projectRoot, "data/veille.json");
export const veilleNewsCachePath = path.join(projectRoot, "data/veille-news-cache.json");
export const eventsStatusCachePath = path.join(projectRoot, "data/events-status-cache.json");
export const monthlyStatePath = path.join(projectRoot, "data/monthly-state.json");
export const partnersPath = path.join(projectRoot, "data/partners.json");
export const overridesPath = path.join(projectRoot, "data/prospect-overrides.json");
export const preferencesPath = path.join(projectRoot, "data/scoring-preferences.json");

const PIPELINE_CAP = 80;

function normalizeSectorGroup(sector) {
  if (!sector) return "Autre";
  const s = sector.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (s.includes("architecte") || s.includes("architecture")) return "Architecture";
  if (s.includes("refrigeration") || s.includes("refriger") || s.includes("froid") || s.includes("chambres froides") || s.includes("thermopompe")) return "Réfrigération / froid";
  if (s.includes("protection incendie") || s.includes("alarme incendie") || s.includes("extincteur") || s.includes("securite incendie") || s.includes("securite commerciale") || s.includes("incendie")) return "Protection incendie / sécurité";
  if (s.includes("alarme") || s.includes("surveillance") || s.includes("camera") || s.includes("securite alarme") || s.includes("controle acces")) return "Sécurité / alarmes";
  if (s.includes("genie-conseil") || s.includes("ingenierie") || s.includes("ingenieurs") || s.includes("ingenieur") || s.includes("genie") || s.includes("inspection batiment") || s.includes("expertise batiment") || s.includes("genie structural") || s.includes("genie civil") || s.includes("genie mecanique") || s.includes("experts-conseils techniques")) return "Génie-conseil / ingénierie";
  if (s.includes("manufacturier") || s.includes("fabrication") || s.includes("fabricant") || s.includes("usinage") || s.includes("aerospace") || s.includes("automation") || s.includes("soudure") || s.includes("menuiserie") || s.includes("ebenis") || s.includes("meuble") || s.includes("aluminium") || s.includes("plastique") || s.includes("tuyauterie industrielle") || s.includes("332") || s.includes("321") || s.includes("326") || s.includes("337")) return "Manufacturier / industrie";
  if (s.includes("distribution alimentaire") || s.includes("grossiste") || s.includes("agroalimentaire") || s.includes("confiserie") || s.includes("gastronomique") || s.includes("viande") || s.includes("charcuterie")) return "Distribution alimentaire";
  if (s.includes("distribution industrielle") || s.includes("distribution mro") || s.includes("outillage") || s.includes("approvisionnement") || s.includes("fournitures industrielles") || s.includes("equipement industriel") || s.includes("fournisseur industriel")) return "Distribution industrielle";
  if (s.includes("distribution") && (s.includes("industriel") || s.includes("mro") || s.includes("outil"))) return "Distribution industrielle";
  if (s.includes("distribution") && (s.includes("aliment") || s.includes("viande") || s.includes("gastronomique"))) return "Distribution alimentaire";
  if (s.includes("comptabilite") || s.includes("services comptables") || s.includes("accounting") || s.includes("fiscalite") || s.includes("finance law") || s.includes("financial advising") || s.includes("cpa")) return "Comptabilité / finance";
  if (s.includes("plomberie") || s.includes("ventilation") || s.includes("climatisation") || s.includes("chauffage") || s.includes("cvac") || s.includes("hvac") || s.includes("mecanique batiment") || s.includes("mecanique procedes") || s.includes("tuyauterie") || s.includes("thermopompe")) return "CVAC / mécanique bâtiment";
  if (s.includes("entrepreneur general") || s.includes("construction") || s.includes("chantier") || s.includes("entrepreneur") || s.includes("236")) return "Construction / entrepreneur";
  if (s.includes("maintenance") || s.includes("sous-traitance industrielle") || s.includes("electromecanique") || s.includes("mecanique industrielle") || s.includes("nettoyage industriel") || s.includes("811")) return "Services techniques / maintenance";
  if (s.includes("agence") || s.includes("marketing") || s.includes("seo") || s.includes("branding") || s.includes("web design") || s.includes("social") || s.includes("contenu") || s.includes("video") || s.includes("graphic design") || s.includes("paid media") || s.includes("digital") || s.includes("advertising") || s.includes("influence") || s.includes("packaging") || s.includes("print")) return "Agence marketing / web";
  if (s.includes("e-commerce") || s.includes("shopify") || s.includes("web development") || s.includes("software") || s.includes("ux") || s.includes("custom software") || s.includes("mobile app")) return "Développement / e-commerce";
  if (s.includes("conseil") || s.includes("consulting") || s.includes("services professionnels")) return "Conseil / services professionnels";
  return "Autre";
}

function nextMondayDate() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : (8 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  return monday.toISOString().split("T")[0];
}

const defaultOverrides = {
  prospects: {}
};

const defaultPreferences = {
  version: 1,
  autoQualification: {
    enabled: true,
    rejectBelowScore: 6.5
  },
  learning: {
    sectorRejectPenaltyThreshold: 2,
    sectorRejectPenaltyStep: 0.45,
    maxLearnedPenalty: 1.35,
    sectorApproveBoostThreshold: 2,
    sectorApproveBoostStep: 0.3,
    maxLearnedBoost: 0.9,
    ruleRejectPenaltyThreshold: 2,
    ruleRejectPenaltyStep: 0.35,
    ruleApproveBoostThreshold: 2,
    ruleApproveBoostStep: 0.2,
    recentActionLookbackDays: 7,
    recentActionWeightMultiplier: 1.4
  },
  commercialFocus: {
    preferredDealMin: 6000,
    preferredDealMax: 10000,
    repeatableProjectBoost: 0.4,
    largeProjectPenalty: 0.4,
    microProjectPenalty: 0.15
  },
  sectorRules: [
    {
      id: "architecture",
      label: "Architecture / projet",
      delta: 1.1,
      match: ["architecture", "architecte", "architectes", "design d'espace"]
    },
    {
      id: "engineering",
      label: "Ingénierie / experts-conseils techniques",
      delta: 1.05,
      match: ["ingénier", "hvac", "mecan", "électr", "electr", "construction", "chantier", "installation", "experts-conseils", "ingenieur-conseil", "ingenieurs-conseils"]
    },
    {
      id: "operations",
      label: "Manufacturing / distribution / terrain",
      delta: 1.15,
      match: ["manufact", "distribution", "grossiste", "logistique", "transport", "inventaire", "portes et fenêtres", "portes et fenetres"]
    },
    {
      id: "marketing",
      label: "Agence marketing",
      delta: -2.4,
      match: ["marketing", "seo", "branding", "publicité", "publicite", "social media", "agence web", "agence marketing", "communication", "graphic design", "creative studio", "contenu", "video"]
    },
    {
      id: "accounting",
      label: "Comptabilité / CPA",
      delta: -2.6,
      match: ["compt", "cpa", "accounting", "fiscal", "tenue de livres", "bookkeeping"]
    },
    {
      id: "generic_services",
      label: "Services génériques",
      delta: -1.1,
      match: ["services", "consultant", "consulting"]
    },
    {
      id: "tech",
      label: "Tech / software",
      delta: -2.2,
      match: ["software", "saas", "app development", "web development", "technolog", "it services", "logiciel", "développement", "developpement", "digital product", "informatique", "numerique", "numérique", "data engineering"]
    },
    {
      id: "internalizable_tech",
      label: "Stack interne forte / forte internalisation",
      delta: -1.4,
      match: ["cto", "equipe produit", "équipe produit", "equipe technique", "équipe technique", "devops", "ai", "ia", "transformation numerique", "transformation numérique", "innovation", "plateforme", "platform", "produit numerique", "produit numérique"]
    }
  ],
  sizeRules: [
    { id: "micro", label: "2-10", delta: -0.2, match: ["2-10", "1-10"] },
    { id: "sweet_spot", label: "11-50", delta: 0.45, match: ["11-50", "10-49"] },
    { id: "too_large", label: "50-249", delta: -0.9, match: ["50-249"] }
  ]
};

function ensurePersistenceFiles() {
  fs.mkdirSync(path.join(projectRoot, "data"), { recursive: true });

  if (!fs.existsSync(overridesPath)) {
    fs.writeFileSync(overridesPath, JSON.stringify(defaultOverrides, null, 2), "utf8");
  }

  if (!fs.existsSync(preferencesPath)) {
    fs.writeFileSync(preferencesPath, JSON.stringify(defaultPreferences, null, 2), "utf8");
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesNormalizedTerm(haystack, term) {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;

  if (normalizedTerm.length <= 2) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`, "i");
    return pattern.test(haystack);
  }

  return haystack.includes(normalizedTerm);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function scoreToNumber(value) {
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower === "à vérifier" || lower.startsWith("à trouver") || lower.startsWith("a trouver")) return "";
  return text;
}

// Enrichit les champs manquants du CSV à partir de la fiche.md (bullet list du haut)
function parseFicheFields(fichePath) {
  if (!fichePath) return {};
  try {
    const text = fs.readFileSync(fichePath, "utf-8");
    const topSection = text.split(/^##\s/m)[0];
    const result = {};
    for (const line of topSection.split("\n")) {
      const m = line.match(/^-\s+(.+?):\s+(.+)$/);
      if (!m) continue;
      const key = m[1].trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const val = m[2].trim();
      if (key === "email") result.email = val;
      else if (key === "telephone" || key === "tel") result.phone = val;
      else if (key === "site" || key === "site web") result.website = val;
      else if (key === "adresse") result.address = val;
      else if (key === "contact" || key === "dirigeant" || key === "decisionnaire") result.owner = val;
    }
    return result;
  } catch {
    return {};
  }
}

function normalizeWebsite(value) {
  const text = cleanValue(value);
  if (!text) return "";

  try {
    const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    const url = new URL(withProtocol);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return normalizeText(text).replace(/^www\./, "");
  }
}

function normalizeCompanyName(value) {
  return normalizeText(value)
    .replace(/&/g, " and ")
    .replace(/\b(inc|inc\.|ltee|ltee\.|ltd|ltd\.|llc|corp|corp\.|corporation|company|co|co\.|cie|cie\.)\b/g, " ")
    .replace(/\b(les|the|groupe|group|services|service|solutions|consultants|consultant|experts|expert|atelier|studio|agence)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D+/g, "");
}

function normalizePersonName(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildProspectLinks({ name, owner, website, websiteNormalized, linkedin, address }) {
  const trimmedName = cleanValue(name);
  const trimmedOwner = cleanValue(owner);
  const trimmedAddress = cleanValue(address);
  const domain = websiteNormalized || normalizeWebsite(website);
  const direct = [];
  const searches = [];

  if (website) {
    direct.push({ type: "website", label: "Site", url: website });
  }

  if (linkedin) {
    direct.push({ type: "linkedin_profile", label: "LinkedIn trouvé", url: linkedin });
  }

  const googleQuery = [trimmedName, trimmedAddress, domain].filter(Boolean).join(" ");
  if (googleQuery) {
    searches.push({ type: "google", label: "Recherche Google", url: buildSearchUrl(googleQuery) });
  }

  const bonlibQuery = ["site:bonlib.com", trimmedName, trimmedAddress].filter(Boolean).join(" ");
  if (bonlibQuery) {
    searches.push({ type: "bonlib", label: "BonLib", url: buildSearchUrl(bonlibQuery) });
  }

  searches.push({
    type: "linkedin_company_search",
    label: "LinkedIn entreprise",
    url: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(trimmedName)}`
  });

  searches.push({
    type: "linkedin_people_search",
    label: "LinkedIn décisionnaire",
    url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent([trimmedOwner || trimmedName, trimmedName].filter((v, i, a) => v && a.indexOf(v) === i).join(" "))}`
  });

  return { direct, searches };
}

function buildStableProspectKey({ websiteNormalized, name, address }) {
  const stableBase = websiteNormalized || [name, address].filter(Boolean).join(" ");
  return slugify(stableBase);
}

function estimateDealSize(score, size, preferences) {
  const lowerSize = normalizeText(size);
  const preferredDealMin = preferences.commercialFocus?.preferredDealMin ?? 6000;
  const preferredDealMax = preferences.commercialFocus?.preferredDealMax ?? 10000;
  const isSweetSpot = lowerSize.includes("11-50") || lowerSize.includes("10-49");
  const isLarge = lowerSize.includes("50-249");

  if (isLarge && score >= 8.6) return 14000;
  if (isSweetSpot && score >= 8.4) return preferredDealMax;
  if (score >= 8) return Math.min(preferredDealMax, 9000);
  if (score >= 7.2) return Math.min(preferredDealMax, 8000);
  if (score >= 6.7) return preferredDealMin;
  return 3500;
}

function readPreferences() {
  ensurePersistenceFiles();
  const stored = readJson(preferencesPath, defaultPreferences);
  return {
    ...defaultPreferences,
    ...stored,
    autoQualification: {
      ...defaultPreferences.autoQualification,
      ...(stored.autoQualification ?? {})
    },
    learning: {
      ...defaultPreferences.learning,
      ...(stored.learning ?? {})
    },
    commercialFocus: {
      ...defaultPreferences.commercialFocus,
      ...(stored.commercialFocus ?? {})
    },
    sectorRules: stored.sectorRules ?? defaultPreferences.sectorRules,
    sizeRules: stored.sizeRules ?? defaultPreferences.sizeRules
  };
}

function readOverrides() {
  ensurePersistenceFiles();
  return readJson(overridesPath, defaultOverrides);
}

async function readOverridesAsync() {
  ensurePersistenceFiles();
  return readOverridesPersistent(overridesPath, defaultOverrides);
}

function renderSummary(summary) {
  const lines = summary.split(/\r?\n/);
  return lines
    .map((line) => {
      if (line.startsWith("# ")) return `<h3>${escapeHtml(line.slice(2))}</h3>`;
      if (line.startsWith("## ")) return `<h4>${escapeHtml(line.slice(3))}</h4>`;
      if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (/^\d+\.\s/.test(line)) return `<li>${escapeHtml(line.replace(/^\d+\.\s/, ""))}</li>`;
      if (!line.trim()) return "";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
}

function buildEvents() {
  const events = readJson(eventsPath, []);
  const status = readJson(eventsStatusCachePath, {});
  if (!Object.keys(status).length) return events;
  return events.map((event) => {
    const s = status[event.id];
    if (!s) return event;
    const isPast = event.dateEnd && new Date(event.dateEnd) < new Date();
    return { ...event, urlStatus: s, needsDateUpdate: isPast && !event.dateLabel?.includes("Récurrent") && !event.window?.startsWith("Récurrent") };
  });
}

function safeDesc(raw) {
  if (!raw) return "";
  // Sécurité : striper tout HTML résiduel dans le cache
  let s = raw.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&#32;/g," ").replace(/&#\d+;/g," ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return s.slice(0, 240);
}

function buildNewsCategoryFromCache(newsCache, categories) {
  if (!newsCache?.items?.length) return categories;

  const newsCategory = {
    category: "Actualités Odoo",
    sources: newsCache.items.map((item, idx) => ({
      id: `news_${idx}`,
      title: item.title,
      description: safeDesc(item.desc) || "Article récent.",
      url: item.link,
      type: item.source === "blog" ? "blog" : "news",
      language: item.lang ? item.lang.toUpperCase() : "EN",
      recommended: item.source === "blog",
      cadence: item.pubDate ? new Date(item.pubDate).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" }) : "Récent"
    }))
  };
  return [newsCategory, ...categories];
}

function buildVeille() {
  const categories = readJson(veillePath, []);
  const newsCache = readNewsCacheSync();
  return buildNewsCategoryFromCache(newsCache, categories);
}

async function buildVeilleAsync() {
  const categories = readJson(veillePath, []);
  const newsCache = await readNewsCache();
  return buildNewsCategoryFromCache(newsCache, categories);
}

function collectBaseData() {
  const batchDirs = fs
    .readdirSync(leadsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("BATCH_"))
    .map((entry) => entry.name)
    .sort()
    .reverse();

  const batches = batchDirs.map((batchName) => {
    const batchRoot = path.join(leadsRoot, batchName);
    const prospectsPath = path.join(batchRoot, "prospects.csv");
    const summaryPath = path.join(batchRoot, "summary.md");
    const rows = parseCsv(readTextIfExists(prospectsPath));

    const prospects = rows.map((row, index) => {
      const companyName = row["Nom entreprise"] || row["Nom"] || "";
      const companySlug = slugify(companyName);
      const fichePath = path.join(leadsRoot, companySlug, "fiche.md");
      const ficheExists = fs.existsSync(fichePath);
      // Enrichissement : la fiche comble les champs vides du CSV
      const fiche = ficheExists ? parseFicheFields(fichePath) : {};

      const rawScore = scoreToNumber(row["Score /10"] || row["Score"] || "");
      const email = cleanValue(row["Email pro"] || row["Email"] || "") || cleanValue(fiche.email || "");
      const phone = cleanValue(row["Téléphone"]) || cleanValue(fiche.phone || "");
      const linkedin = cleanValue(row["LinkedIn dirigeant"] || "");
      const website = cleanValue(row["Site web"]) || cleanValue(fiche.website || "");
      const owner = cleanValue(row["Nom du dirigeant"] || row["Dirigeant"] || "") || cleanValue(fiche.owner || "");
      const address = cleanValue(row["Adresse"]) || cleanValue(fiche.address || "");
      const websiteNormalized = normalizeWebsite(website);
      const stableKey = buildStableProspectKey({
        websiteNormalized,
        name: companyName,
        address
      });

      return {
        id: stableKey,
        sourceId: `${batchName}_${index}_${companySlug}`,
        batch: batchName,
        batchLabel: batchName.replace("BATCH_", ""),
        sourceLabel: batchName.replace("BATCH_", ""),
        name: companyName,
        website,
        websiteNormalized,
        address,
        size: row["Taille estimée"] ?? "",
        sector: row["Secteur (SCIAN approx)"] || row["Secteur (SCIAN)"] || row["Secteur"] || "",
        sectorGroup: normalizeSectorGroup(row["Secteur (SCIAN approx)"] || row["Secteur (SCIAN)"] || row["Secteur"] || ""),
        owner,
        linkedin,
        email,
        phone,
        rawScore,
        rawScoreLabel: row["Score /10"] || row["Score"] || "",
        angle: row["Angle d'attaque"] ?? "",
        signal: row["Signal timing"] ?? "",
        sources: row["Source(s)"] || row["Source"] || "",
        fichePath: ficheExists ? fichePath : "",
        hasContact: Boolean(email || phone || linkedin),
        hasDirectContact: Boolean(email || phone),
        ownerNormalized: normalizePersonName(owner),
        emailNormalized: normalizeText(email),
        phoneNormalized: normalizePhone(phone),
        resourceLinks: buildProspectLinks({
          name: companyName,
          owner,
          website,
          websiteNormalized,
          linkedin,
          address
        })
      };
    });

    return {
      name: batchName,
      label: batchName.replace("BATCH_", ""),
      count: prospects.length,
      summary: readTextIfExists(summaryPath),
      prospects
    };
  });

  const flatProspects = batches.flatMap((batch) => batch.prospects);
  const deduped = dedupeProspects(flatProspects);

  return {
    batches,
    prospects: deduped.prospects,
    duplicatesRemoved: deduped.duplicatesRemoved,
    automations: readJson(automationsPath, []),
    events: buildEvents(),
    playbooks: readJson(playbooksPath, []),
    veille: buildVeille(),
    partners: readJson(partnersPath, [])
  };
}

async function collectBaseDataAsync() {
  let rawProspects = [];

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: PROSPECTS_BLOB_KEY });
      const match = blobs.find((b) => b.pathname === PROSPECTS_BLOB_KEY);
      if (match) {
        const res = await fetch(match.url, { cache: "no-store" });
        if (res.ok) rawProspects = await res.json();
      }
    } catch (err) {
      console.log(`[blob] collectBaseDataAsync error: ${err.message}`);
    }
  }

  const batchName = "BLOB_LATEST";
  const prospects = rawProspects.map((row, index) => {
    const companyName = row.name || "";
    const companySlug = slugify(companyName);
    const rawScore = scoreToNumber(row.rawScore ?? 0);
    const email = cleanValue(row.email || "");
    const linkedin = cleanValue(row.linkedin || "");
    const website = cleanValue(row.website || "");
    const owner = cleanValue(row.owner || "");
    const address = cleanValue(row.address || "");
    const websiteNormalized = normalizeWebsite(website);
    const stableKey = buildStableProspectKey({ websiteNormalized, name: companyName, address });

    return {
      id: stableKey,
      sourceId: `${batchName}_${index}_${companySlug}`,
      batch: batchName,
      batchLabel: "Blob",
      sourceLabel: "Blob",
      name: companyName,
      website,
      websiteNormalized,
      address,
      size: row.size ?? "",
      sector: row.sector || "",
      sectorGroup: normalizeSectorGroup(row.sector || ""),
      owner,
      linkedin,
      email,
      phone: "",
      rawScore,
      rawScoreLabel: String(row.rawScore ?? ""),
      angle: row.angle ?? "",
      signal: row.signal ?? "",
      sources: row.sources || "",
      fichePath: "",
      hasContact: Boolean(email || linkedin),
      hasDirectContact: Boolean(email),
      ownerNormalized: normalizePersonName(owner),
      emailNormalized: normalizeText(email),
      phoneNormalized: "",
      resourceLinks: buildProspectLinks({ name: companyName, owner, website, websiteNormalized, linkedin, address })
    };
  });

  const batches = prospects.length > 0
    ? [{ name: batchName, label: "Blob", count: prospects.length, summary: "", prospects }]
    : [];

  const deduped = dedupeProspects(prospects);

  return {
    batches,
    prospects: deduped.prospects,
    duplicatesRemoved: deduped.duplicatesRemoved,
    automations: readJson(automationsPath, []),
    events: buildEvents(),
    playbooks: readJson(playbooksPath, []),
    veille: buildVeille(),
    partners: readJson(partnersPath, [])
  };
}

function parseEventDate(value) {
  if (!value) return Number.NaN;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function buildEventSummary(events) {
  const now = Date.now();
  const next90Days = now + (90 * 24 * 60 * 60 * 1000);
  const sortedUpcoming = [...events]
    .filter((event) => Number.isFinite(parseEventDate(event.dateStart)))
    .sort((left, right) => parseEventDate(left.dateStart) - parseEventDate(right.dateStart));
  const nextEvent = sortedUpcoming.find((event) => parseEventDate(event.dateStart) >= now) ?? sortedUpcoming[0] ?? null;

  return {
    total: events.length,
    highPriority: events.filter((event) => event.priority === "high").length,
    upcoming90Days: events.filter((event) => {
      const date = parseEventDate(event.dateStart);
      return Number.isFinite(date) && date >= now && date <= next90Days;
    }).length,
    typeCount: [...new Set(events.map((event) => event.type).filter(Boolean))].length,
    nextEvent: nextEvent
      ? {
          name: nextEvent.name,
          dateLabel: nextEvent.dateLabel || nextEvent.window || "",
          city: nextEvent.city || ""
        }
      : null
  };
}

function canonicalProspectKey(prospect) {
  const normalizedName = normalizeCompanyName(prospect.name);
  const normalizedAddress = normalizeText(prospect.address);

  if (prospect.websiteNormalized) {
    return `website:${prospect.websiteNormalized}`;
  }

  if (prospect.emailNormalized) {
    return `email:${prospect.emailNormalized}`;
  }

  if (prospect.phoneNormalized) {
    return `phone:${prospect.phoneNormalized}`;
  }

  if (normalizedName) {
    return `name:${normalizedName}`;
  }

  if (normalizedAddress) {
    return `address:${normalizedAddress}`;
  }

  return prospect.id;
}

function compareProspectQuality(left, right) {
  if (left.rawScore !== right.rawScore) return right.rawScore - left.rawScore;
  if (left.hasDirectContact !== right.hasDirectContact) return Number(right.hasDirectContact) - Number(left.hasDirectContact);
  if (left.hasContact !== right.hasContact) return Number(right.hasContact) - Number(left.hasContact);
  if (left.batchLabel !== right.batchLabel) return right.batchLabel.localeCompare(left.batchLabel, "fr");
  return left.name.localeCompare(right.name, "fr");
}

function dedupeProspects(prospects) {
  const groups = [];

  const groupMatchesProspect = (group, prospect) => {
    const candidateName = normalizeCompanyName(prospect.name);
    const candidateAddress = normalizeText(prospect.address);

    return group.items.some((item) => {
      const sameWebsite = Boolean(prospect.websiteNormalized) && prospect.websiteNormalized === item.websiteNormalized;
      const sameEmail = Boolean(prospect.emailNormalized) && prospect.emailNormalized === item.emailNormalized;
      const samePhone = Boolean(prospect.phoneNormalized) && prospect.phoneNormalized === item.phoneNormalized;
      const sameCanonicalKey = canonicalProspectKey(prospect) === canonicalProspectKey(item);
      const sameName = Boolean(candidateName) && candidateName === normalizeCompanyName(item.name);
      const sameNameAndAddress = sameName && Boolean(candidateAddress) && candidateAddress === normalizeText(item.address);

      return sameWebsite || sameEmail || samePhone || sameCanonicalKey || sameNameAndAddress || sameName;
    });
  };

  prospects.forEach((prospect) => {
    const existingGroup = groups.find((group) => groupMatchesProspect(group, prospect));
    if (existingGroup) {
      existingGroup.items.push(prospect);
      return;
    }

    groups.push({ items: [prospect] });
  });

  const uniqueProspects = [];
  let duplicatesRemoved = 0;

  groups.forEach((group) => {
    const sorted = [...group.items].sort(compareProspectQuality);
    const primary = sorted[0];
    const duplicates = sorted.slice(1);
    duplicatesRemoved += duplicates.length;

    uniqueProspects.push({
      ...primary,
      duplicateCount: duplicates.length,
      duplicateNames: duplicates.map((item) => item.name),
      sourceLabels: [...new Set(sorted.map((item) => item.sourceLabel))].sort((left, right) => right.localeCompare(left, "fr")),
      sourceCount: sorted.length,
      mergedFrom: sorted.map((item) => ({
        batchLabel: item.batchLabel,
        name: item.name,
        website: item.website,
        email: item.email,
        phone: item.phone
      }))
    });
  });

  return {
    prospects: uniqueProspects,
    duplicatesRemoved
  };
}

function matchingRuleDeltas(prospect, rules) {
  const haystack = normalizeText([prospect.sector, prospect.name, prospect.angle, prospect.signal].join(" "));
  return rules
    .filter((rule) => rule.match.some((term) => matchesNormalizedTerm(haystack, term)))
    .map((rule) => ({
      id: rule.id,
      label: rule.label,
      delta: rule.delta
    }));
}

function resolveRuleConflicts(ruleDeltas) {
  const hasEngineering = ruleDeltas.some((item) => item.id === "engineering");
  const hasTech = ruleDeltas.some((item) => item.id === "tech" || item.id === "internalizable_tech");

  return ruleDeltas.filter((item) => {
    if (hasEngineering && item.id === "generic_services") {
      return false;
    }

    if (hasEngineering && hasTech && item.id === "engineering") {
      return false;
    }

    return true;
  });
}

function effectiveRuleDeltas(prospect, rules) {
  return resolveRuleConflicts(matchingRuleDeltas(prospect, rules));
}

function matchingSizeDeltas(prospect, rules) {
  const size = normalizeText(prospect.size);
  return rules
    .filter((rule) => rule.match.some((term) => matchesNormalizedTerm(size, term)))
    .map((rule) => ({
      id: rule.id,
      label: rule.label,
      delta: rule.delta
    }));
}

function buildCommercialFocusContribution(prospect, preferences) {
  const lowerSize = normalizeText(prospect.size);
  const repeatableProjectBoost = preferences.commercialFocus?.repeatableProjectBoost ?? 0.4;
  const largeProjectPenalty = preferences.commercialFocus?.largeProjectPenalty ?? 0.4;
  const microProjectPenalty = preferences.commercialFocus?.microProjectPenalty ?? 0.15;
  const blockingRuleIds = new Set(
    effectiveRuleDeltas(prospect, preferences.sectorRules ?? [])
      .map((item) => item.id)
      .filter((id) => ["marketing", "accounting", "generic_services", "tech", "internalizable_tech"].includes(id))
  );
  const isSweetSpot = lowerSize.includes("11-50") || lowerSize.includes("10-49");
  const isLarge = lowerSize.includes("50-249");
  const isMicro = lowerSize.includes("1-10") || lowerSize.includes("2-10");

  if (isSweetSpot && prospect.rawScore >= 6.8 && prospect.rawScore <= 8.8 && blockingRuleIds.size === 0) {
    return {
      id: "commercial_focus",
      label: "Fit pack 6k-10k / petits projets répétables",
      delta: repeatableProjectBoost
    };
  }

  if (isLarge) {
    return {
      id: "commercial_focus_large",
      label: "Projet potentiellement plus lourd que le focus actuel",
      delta: -largeProjectPenalty
    };
  }

  if (isMicro && prospect.rawScore < 7) {
    return {
      id: "commercial_focus_micro",
      label: "Micro-structure peu alignée avec un pack structuré",
      delta: -microProjectPenalty
    };
  }

  return null;
}

function computeActionWeight(override, preferences) {
  const decision = override?.decision ?? "none";
  const lookbackDays = preferences.learning?.recentActionLookbackDays ?? 7;
  const recentActionWeightMultiplier = preferences.learning?.recentActionWeightMultiplier ?? 1.4;
  const updatedAt = override?.updatedAt ? Date.parse(override.updatedAt) : Number.NaN;
  const isRecent = Number.isFinite(updatedAt) && (Date.now() - updatedAt) <= (lookbackDays * 24 * 60 * 60 * 1000);

  let weight = 0;
  if (decision === "approved") weight = 1.3;
  if (decision === "review") weight = 0.6;
  if (decision === "rejected") weight = 1.15;
  if (override?.reason === "qualified") weight += 0.4;
  if (override?.reason === "duplicate") weight += 0.2;
  if (isRecent && weight > 0) weight *= recentActionWeightMultiplier;
  return Number(weight.toFixed(2));
}

function buildLearningSignals(baseProspects, overrides, preferences) {
  const sectorRejectThreshold = preferences.learning?.sectorRejectPenaltyThreshold ?? 2;
  const sectorRejectStep = preferences.learning?.sectorRejectPenaltyStep ?? 0.45;
  const maxPenalty = preferences.learning?.maxLearnedPenalty ?? 1.35;
  const sectorApproveThreshold = preferences.learning?.sectorApproveBoostThreshold ?? 2;
  const sectorApproveStep = preferences.learning?.sectorApproveBoostStep ?? 0.3;
  const maxBoost = preferences.learning?.maxLearnedBoost ?? 0.9;
  const ruleRejectThreshold = preferences.learning?.ruleRejectPenaltyThreshold ?? 2;
  const ruleRejectStep = preferences.learning?.ruleRejectPenaltyStep ?? 0.35;
  const ruleApproveThreshold = preferences.learning?.ruleApproveBoostThreshold ?? 2;
  const ruleApproveStep = preferences.learning?.ruleApproveBoostStep ?? 0.2;
  const lookbackDays = preferences.learning?.recentActionLookbackDays ?? 7;
  const lookbackWindowMs = lookbackDays * 24 * 60 * 60 * 1000;

  const isHumanOverride = (override) => override?.decision && override.decision !== "none" && !override.autoRejected;
  const rejected = baseProspects.filter((prospect) => {
    const override = overrides.prospects[prospect.id];
    return override?.decision === "rejected" && !override?.autoRejected;
  });
  const approved = baseProspects.filter((prospect) => {
    const override = overrides.prospects[prospect.id];
    if (override?.autoRejected) return false;
    const decision = override?.decision;
    const reason = override?.reason;
    return decision === "approved" || reason === "qualified";
  });
  const actions = baseProspects
    .map((prospect) => ({
      prospect,
      override: overrides.prospects[prospect.id] ?? null
    }))
    .filter(({ override }) => isHumanOverride(override));
  const recentActions = actions.filter(({ override }) => {
    const updatedAt = override?.updatedAt ? Date.parse(override.updatedAt) : Number.NaN;
    return Number.isFinite(updatedAt) && (Date.now() - updatedAt) <= lookbackWindowMs;
  });

  const weightedRejectedSectors = rejected.reduce((accumulator, prospect) => {
    const key = normalizeText(prospect.sector);
    if (!key) return accumulator;
    const weight = computeActionWeight(overrides.prospects[prospect.id], preferences);
    accumulator[key] = (accumulator[key] ?? 0) + weight;
    return accumulator;
  }, {});

  const weightedApprovedSectors = approved.reduce((accumulator, prospect) => {
    const key = normalizeText(prospect.sector);
    if (!key) return accumulator;
    const weight = computeActionWeight(overrides.prospects[prospect.id], preferences);
    accumulator[key] = (accumulator[key] ?? 0) + weight;
    return accumulator;
  }, {});

  const rejectedSectors = rejected.reduce((accumulator, prospect) => {
    const key = normalizeText(prospect.sector);
    if (!key) return accumulator;
    const entry = accumulator[key] ?? {
      sector: prospect.sector,
      count: 0
    };
    entry.count += 1;
    accumulator[key] = entry;
    return accumulator;
  }, {});

  const rejectedReasons = rejected.reduce((accumulator, prospect) => {
    const reason = overrides.prospects[prospect.id]?.reason || "non_precise";
    accumulator[reason] = (accumulator[reason] ?? 0) + 1;
    return accumulator;
  }, {});

  const approvedSectors = approved.reduce((accumulator, prospect) => {
    const key = normalizeText(prospect.sector);
    if (!key) return accumulator;
    const entry = accumulator[key] ?? {
      sector: prospect.sector,
      count: 0
    };
    entry.count += 1;
    accumulator[key] = entry;
    return accumulator;
  }, {});

  const buildRuleCounter = (prospects) => prospects.reduce((accumulator, prospect) => {
    const rules = new Set(effectiveRuleDeltas(prospect, preferences.sectorRules ?? []).map((item) => item.id));
    const weight = computeActionWeight(overrides.prospects[prospect.id], preferences);
    rules.forEach((ruleId) => {
      accumulator[ruleId] = (accumulator[ruleId] ?? 0) + weight;
    });
    return accumulator;
  }, {});

  const rejectedRules = buildRuleCounter(rejected);
  const approvedRules = buildRuleCounter(approved);

  const sectorPenalties = Object.fromEntries(
    Object.entries(weightedRejectedSectors).map(([key, weight]) => {
      const extraRejects = Math.max(0, weight - sectorRejectThreshold + 1);
      const penalty = Math.min(maxPenalty, extraRejects * sectorRejectStep);
      return [key, penalty];
    })
  );

  const sectorBoosts = Object.fromEntries(
    Object.entries(weightedApprovedSectors).map(([key, weight]) => {
      const extraApprovals = Math.max(0, weight - sectorApproveThreshold + 1);
      const boost = Math.min(maxBoost, extraApprovals * sectorApproveStep);
      return [key, boost];
    })
  );

  const ruleAdjustments = {};
  Object.entries(rejectedRules).forEach(([ruleId, count]) => {
    const extraRejects = Math.max(0, count - ruleRejectThreshold + 1);
    if (extraRejects > 0) {
      ruleAdjustments[ruleId] = (ruleAdjustments[ruleId] ?? 0) - (extraRejects * ruleRejectStep);
    }
  });
  Object.entries(approvedRules).forEach(([ruleId, count]) => {
    const extraApprovals = Math.max(0, count - ruleApproveThreshold + 1);
    if (extraApprovals > 0) {
    ruleAdjustments[ruleId] = (ruleAdjustments[ruleId] ?? 0) + (extraApprovals * ruleApproveStep);
    }
  });

  return {
    rejectedSectors: Object.values(rejectedSectors).sort((left, right) => right.count - left.count),
    approvedSectors: Object.values(approvedSectors).sort((left, right) => right.count - left.count),
    rejectedReasons: Object.entries(rejectedReasons)
      .sort((left, right) => right[1] - left[1])
      .map(([reason, count]) => ({ reason, count })),
    recentActions: {
      lookbackDays,
      approved: recentActions.filter(({ override }) => override.decision === "approved").length,
      review: recentActions.filter(({ override }) => override.decision === "review").length,
      rejected: recentActions.filter(({ override }) => override.decision === "rejected").length,
      total: recentActions.length
    },
    sectorPenalties,
    sectorBoosts,
    ruleAdjustments
  };
}

function priorityFromAdjustedScore(score) {
  if (score >= 8.4) return "A";
  if (score >= 7.1) return "B";
  return "C";
}

function statusFromAdjustedScore(score, decision) {
  if (decision === "odoo_done") return "odoo_done";
  if (decision === "bad_fit") return "bad_fit";
  if (decision === "to_recontact") return "a_recontacter";
  if (decision === "rejected") return "ecarte";
  if (decision === "review") return "a_revoir";
  if (score >= 8.4) return "chaud";
  if (score >= 7.1) return "a_travailler";
  return "file_attente";
}

function hasManualQualificationOverride(override) {
  if (!override) return false;
  return override.decision === "approved" || override.decision === "review" || override.reason === "qualified" || override.reason === "good_fit";
}

function isAutoRejectedOverride(override) {
  return Boolean(override?.autoRejected);
}

function inferAutoRejectReason(prospect, preferences) {
  const ruleIds = new Set(effectiveRuleDeltas(prospect, preferences.sectorRules ?? []).map((item) => item.id));

  if (ruleIds.has("tech") || ruleIds.has("internalizable_tech")) {
    return "too_tech";
  }

  if (ruleIds.has("accounting")) {
    return "accounting";
  }

  if (ruleIds.has("generic_services") || ruleIds.has("marketing")) {
    return "generic_services";
  }

  return "low_fit";
}

function isForcedRejectProspect(prospect, preferences) {
  const ruleIds = new Set(effectiveRuleDeltas(prospect, preferences.sectorRules ?? []).map((item) => item.id));
  return ruleIds.has("marketing") || ruleIds.has("accounting") || ruleIds.has("tech");
}

function applyProspectModel(baseProspects, overrides, preferences) {
  const learning = buildLearningSignals(baseProspects, overrides, preferences);

  const modeled = baseProspects.map((prospect) => {
    const override = overrides.prospects[prospect.id] ?? {};
    const ruleDeltas = effectiveRuleDeltas(prospect, preferences.sectorRules ?? []);
    const sizeDeltas = matchingSizeDeltas(prospect, preferences.sizeRules ?? []);
    const commercialFocusContribution = buildCommercialFocusContribution(prospect, preferences);
    const learnedPenalty = learning.sectorPenalties[normalizeText(prospect.sector)] ?? 0;
    const learnedBoost = learning.sectorBoosts[normalizeText(prospect.sector)] ?? 0;
    const learnedRuleAdjustment = ruleDeltas.reduce((sum, item) => sum + (learning.ruleAdjustments[item.id] ?? 0), 0);
    const contributions = [...ruleDeltas, ...sizeDeltas, commercialFocusContribution].filter(Boolean);
    const adjustment = contributions.reduce((sum, item) => sum + item.delta, 0) - learnedPenalty + learnedBoost + learnedRuleAdjustment;
    const manualBoost = override.decision === "approved" ? 0.5 : 0;
    const adjustedScoreValue = Math.max(0, Math.min(10, Number((prospect.rawScore + adjustment + manualBoost).toFixed(1))));
    const priority = priorityFromAdjustedScore(adjustedScoreValue);
    const status = statusFromAdjustedScore(adjustedScoreValue, override.decision);
    const excluded = override.decision === "rejected" || override.decision === "odoo_done" || override.decision === "bad_fit";

    return {
      ...prospect,
      scoreValue: adjustedScoreValue,
      score: adjustedScoreValue.toFixed(1),
      priority,
      status,
      estimatedDeal: estimateDealSize(adjustedScoreValue, prospect.size, preferences),
      override: {
        decision: override.decision ?? "none",
        reason: override.reason ?? "",
        note: override.note ?? "",
        updatedAt: override.updatedAt ?? "",
        autoRejected: override.autoRejected === true
      },
      scoring: {
        rawScore: prospect.rawScore,
        adjustedScore: adjustedScoreValue,
        learnedPenalty,
        learnedBoost,
        learnedRuleAdjustment,
        contributions
      },
      excluded
    };
  });

  return {
    prospects: modeled.sort((left, right) => {
      if (left.excluded !== right.excluded) return left.excluded ? 1 : -1;
      return right.scoreValue - left.scoreValue || left.name.localeCompare(right.name, "fr");
    }),
    learning
  };
}

function persistAutomaticRejections(modeledProspects, overrides, preferences) {
  const autoQualification = preferences.autoQualification ?? {};
  const rejectBelowScore = Number(autoQualification.rejectBelowScore ?? 5);

  if (!autoQualification.enabled || !Number.isFinite(rejectBelowScore)) {
    return overrides;
  }

  const nextOverrides = {
    ...overrides,
    prospects: {
      ...(overrides.prospects ?? {})
    }
  };
  let changed = false;

  modeledProspects.forEach((prospect) => {
    const existing = nextOverrides.prospects[prospect.id];
    if (hasManualQualificationOverride(existing)) return;
    if (existing?.decision === "rejected" && !isAutoRejectedOverride(existing)) return;

    const forcedReject = isForcedRejectProspect(prospect, preferences);
    if (!forcedReject && prospect.rawScore >= rejectBelowScore) {
      if (isAutoRejectedOverride(existing)) {
        delete nextOverrides.prospects[prospect.id];
        changed = true;
      }
      return;
    }

    const reason = inferAutoRejectReason(prospect, preferences);
    const note = forcedReject
      ? `Auto-écarté: secteur hors ICP (${reason}).`
      : `Auto-écarté: score brut ${prospect.rawScore.toFixed(1)} < ${rejectBelowScore.toFixed(1)}.`;

    if (
      existing?.decision === "rejected" &&
      existing?.reason === reason &&
      existing?.note === note &&
      existing?.autoRejected === true
    ) {
      return;
    }

    nextOverrides.prospects[prospect.id] = {
      decision: "rejected",
      reason,
      note,
      updatedAt: existing?.updatedAt ?? new Date().toISOString(),
      autoRejected: true
    };
    changed = true;
  });

  if (changed) {
    fs.writeFileSync(overridesPath, JSON.stringify(nextOverrides, null, 2), "utf8");
  }

  return changed ? nextOverrides : overrides;
}

async function persistAutomaticRejectionsAsync(modeledProspects, overrides, preferences) {
  const autoQualification = preferences.autoQualification ?? {};
  const rejectBelowScore = Number(autoQualification.rejectBelowScore ?? 5);

  if (!autoQualification.enabled || !Number.isFinite(rejectBelowScore)) {
    return overrides;
  }

  const nextOverrides = {
    ...overrides,
    prospects: {
      ...(overrides.prospects ?? {})
    }
  };
  let changed = false;

  modeledProspects.forEach((prospect) => {
    const existing = nextOverrides.prospects[prospect.id];
    if (hasManualQualificationOverride(existing)) return;
    if (existing?.decision === "rejected" && !isAutoRejectedOverride(existing)) return;

    const forcedReject = isForcedRejectProspect(prospect, preferences);
    if (!forcedReject && prospect.rawScore >= rejectBelowScore) {
      if (isAutoRejectedOverride(existing)) {
        delete nextOverrides.prospects[prospect.id];
        changed = true;
      }
      return;
    }

    const reason = inferAutoRejectReason(prospect, preferences);
    const note = forcedReject
      ? `Auto-écarté: secteur hors ICP (${reason}).`
      : `Auto-écarté: score brut ${prospect.rawScore.toFixed(1)} < ${rejectBelowScore.toFixed(1)}.`;

    if (
      existing?.decision === "rejected" &&
      existing?.reason === reason &&
      existing?.note === note &&
      existing?.autoRejected === true
    ) {
      return;
    }

    nextOverrides.prospects[prospect.id] = {
      decision: "rejected",
      reason,
      note,
      updatedAt: existing?.updatedAt ?? new Date().toISOString(),
      autoRejected: true
    };
    changed = true;
  });

  if (changed) {
    await writeOverridesPersistent(overridesPath, nextOverrides);
  }

  return changed ? nextOverrides : overrides;
}

function buildMetrics(prospects, batches, automations) {
  const visibleProspects = prospects.filter((item) => !item.excluded);
  const totalProspects = visibleProspects.length;
  const excludedProspects = prospects.length - totalProspects;
  const hotProspects = visibleProspects.filter((item) => item.priority === "A");
  const contactCoverage = totalProspects ? Math.round((visibleProspects.filter((item) => item.hasContact).length / totalProspects) * 100) : 0;
  const directCoverage = totalProspects ? Math.round((visibleProspects.filter((item) => item.hasDirectContact).length / totalProspects) * 100) : 0;
  const estimatedPipeline = visibleProspects.reduce((sum, item) => sum + item.estimatedDeal, 0);
  const weightedPipeline = Math.round(visibleProspects.reduce((sum, item) => sum + (item.estimatedDeal * (item.scoreValue / 10)), 0));
  const averageScore = totalProspects ? Number((visibleProspects.reduce((sum, item) => sum + item.scoreValue, 0) / totalProspects).toFixed(1)) : 0;

  const topSectors = Object.entries(
    visibleProspects.reduce((accumulator, prospect) => {
      if (!prospect.sector) return accumulator;
      accumulator[prospect.sector] = (accumulator[prospect.sector] ?? 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  const automationsByStatus = {
    active: automations.filter((item) => item.status === "active").length,
    warning: automations.filter((item) => item.status === "warning").length,
    error: automations.filter((item) => item.status === "error").length
  };

  return {
    totalProspects,
    excludedProspects,
    hotProspects: hotProspects.length,
    averageScore,
    contactCoverage,
    directCoverage,
    estimatedPipeline,
    weightedPipeline,
    activeBatches: batches.length,
    automationsByStatus,
    topSectors
  };
}

export function collectDashboardData() {
  ensurePersistenceFiles();
  const preferences = readPreferences();
  const overrides = readOverrides();
  const base = collectBaseData();
  const initialModel = applyProspectModel(base.prospects, overrides, preferences);
  const syncedOverrides = persistAutomaticRejections(initialModel.prospects, overrides, preferences);
  const modeled = syncedOverrides === overrides ? initialModel : applyProspectModel(base.prospects, syncedOverrides, preferences);

  const nonExcluded = modeled.prospects.filter((p) => !p.excluded);
  const activeIds = new Set(nonExcluded.slice(0, PIPELINE_CAP).map((p) => p.id));
  const pipelineProspects = modeled.prospects.map((p) => ({
    ...p,
    pipelineSlot: p.excluded ? "blacklisted" : (activeIds.has(p.id) ? "active" : "reserve")
  }));
  const pipeline = {
    activeCount: Math.min(nonExcluded.length, PIPELINE_CAP),
    cap: PIPELINE_CAP,
    reserveCount: Math.max(0, nonExcluded.length - PIPELINE_CAP),
    nextRefillDate: nextMondayDate()
  };

  const batches = base.batches.map((batch) => ({
    ...batch,
    prospects: pipelineProspects.filter((prospect) => prospect.batch === batch.name)
  }));

  return {
    generatedAt: new Date().toISOString(),
    mode: "api",
    batches,
    prospects: pipelineProspects,
    pipeline,
    automations: base.automations,
    events: base.events,
    playbooks: base.playbooks,
    veille: base.veille,
    partners: base.partners,
    monthlyState: readJson(monthlyStatePath, null),
    eventSummary: buildEventSummary(base.events),
    metrics: buildMetrics(modeled.prospects, batches, base.automations),
    duplicatesRemoved: base.duplicatesRemoved,
    sourcingContext: [
      "Tri prioritaire sur les PME avec vraie complexité opérations, projets, inventaire, terrain ou coordination.",
      "Pénalité forte sur les agences marketing/web, software shops et structures trop internalisables.",
      `Les prospects sous ${Number(preferences.autoQualification?.rejectBelowScore ?? 5).toFixed(1)}/10 sont écartés automatiquement et mémorisés.`,
      "Sweet spot commercial actuel: packs Odoo répétables autour de 6k-10k CAD.",
      "Le classement apprend à partir des décisions de qualification réellement prises dans la semaine.",
      base.duplicatesRemoved > 0 ? `Les sources multiples sont fusionnées avant affichage (${base.duplicatesRemoved} entrées retirées).` : "Aucun doublon détecté dans les sources actuelles."
    ],
    learning: modeled.learning,
    preferences,
    paths: {
      overridesPath,
      preferencesPath,
      distPath
    },
    renderSummaryMarkup: renderSummary.toString()
  };
}

export async function collectDashboardDataAsync() {
  ensurePersistenceFiles();
  const preferences = readPreferences();
  const overrides = await readOverridesAsync();
  const base = await collectBaseDataAsync();
  const initialModel = applyProspectModel(base.prospects, overrides, preferences);
  const syncedOverrides = await persistAutomaticRejectionsAsync(initialModel.prospects, overrides, preferences);
  const modeled = syncedOverrides === overrides ? initialModel : applyProspectModel(base.prospects, syncedOverrides, preferences);

  const nonExcluded = modeled.prospects.filter((p) => !p.excluded);
  const activeIds = new Set(nonExcluded.slice(0, PIPELINE_CAP).map((p) => p.id));
  const pipelineProspects = modeled.prospects.map((p) => ({
    ...p,
    pipelineSlot: p.excluded ? "blacklisted" : (activeIds.has(p.id) ? "active" : "reserve")
  }));
  const pipeline = {
    activeCount: Math.min(nonExcluded.length, PIPELINE_CAP),
    cap: PIPELINE_CAP,
    reserveCount: Math.max(0, nonExcluded.length - PIPELINE_CAP),
    nextRefillDate: nextMondayDate()
  };

  const batches = base.batches.map((batch) => ({
    ...batch,
    prospects: pipelineProspects.filter((prospect) => prospect.batch === batch.name)
  }));

  const veille = await buildVeilleAsync();

  return {
    generatedAt: new Date().toISOString(),
    mode: "api",
    batches,
    prospects: pipelineProspects,
    pipeline,
    automations: base.automations,
    events: base.events,
    playbooks: base.playbooks,
    veille,
    partners: base.partners,
    monthlyState: readJson(monthlyStatePath, null),
    eventSummary: buildEventSummary(base.events),
    metrics: buildMetrics(modeled.prospects, batches, base.automations),
    duplicatesRemoved: base.duplicatesRemoved,
    sourcingContext: [
      "Tri prioritaire sur les PME avec vraie complexité opérations, projets, inventaire, terrain ou coordination.",
      "Pénalité forte sur les agences marketing/web, software shops et structures trop internalisables.",
      `Les prospects sous ${Number(preferences.autoQualification?.rejectBelowScore ?? 5).toFixed(1)}/10 sont écartés automatiquement et mémorisés.`,
      "Sweet spot commercial actuel: packs Odoo répétables autour de 6k-10k CAD.",
      "Le classement apprend à partir des décisions de qualification réellement prises dans la semaine.",
      base.duplicatesRemoved > 0 ? `Les sources multiples sont fusionnées avant affichage (${base.duplicatesRemoved} entrées retirées).` : "Aucun doublon détecté dans les sources actuelles."
    ],
    learning: modeled.learning,
    preferences,
    paths: {
      overridesPath,
      preferencesPath,
      distPath
    },
    renderSummaryMarkup: renderSummary.toString()
  };
}

export function saveProspectFeedback(id, payload) {
  const validDecisions = new Set(["approved", "review", "rejected", "odoo_done", "bad_fit", "to_recontact", "none"]);
  if (!validDecisions.has(payload.decision ?? "none")) {
    const error = new Error("Decision invalide");
    error.statusCode = 400;
    throw error;
  }

  const existingProspectIds = new Set(collectDashboardData().prospects.map((prospect) => prospect.id));
  if (!existingProspectIds.has(id)) {
    const error = new Error("Prospect introuvable");
    error.statusCode = 404;
    throw error;
  }

  const overrides = readOverrides();
  const nextDecision = payload.decision ?? "none";

  if (nextDecision === "none") {
    delete overrides.prospects[id];
  } else {
    overrides.prospects[id] = {
      decision: nextDecision,
      reason: payload.reason ?? "",
      note: String(payload.note ?? "").slice(0, 2000),
      updatedAt: new Date().toISOString()
    };
  }

  fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), "utf8");
  return collectDashboardData();
}

export async function saveProspectFeedbackAsync(id, payload) {
  const validDecisions = new Set(["approved", "review", "rejected", "odoo_done", "bad_fit", "to_recontact", "none"]);
  if (!validDecisions.has(payload.decision ?? "none")) {
    const error = new Error("Decision invalide");
    error.statusCode = 400;
    throw error;
  }

  const snapshot = await collectDashboardDataAsync();
  const existingProspectIds = new Set(snapshot.prospects.map((prospect) => prospect.id));
  if (!existingProspectIds.has(id)) {
    const error = new Error("Prospect introuvable");
    error.statusCode = 404;
    throw error;
  }

  const overrides = await readOverridesAsync();
  const nextDecision = payload.decision ?? "none";

  if (nextDecision === "none") {
    delete overrides.prospects[id];
  } else {
    overrides.prospects[id] = {
      decision: nextDecision,
      reason: payload.reason ?? "",
      note: String(payload.note ?? "").slice(0, 2000),
      updatedAt: new Date().toISOString()
    };
  }

  await writeOverridesPersistent(overridesPath, overrides);
  return collectDashboardDataAsync();
}

export function updatePreferences(nextPreferences) {
  const current = readPreferences();
  const merged = {
    ...current,
    ...nextPreferences
  };
  fs.writeFileSync(preferencesPath, JSON.stringify(merged, null, 2), "utf8");
  return collectDashboardData();
}
