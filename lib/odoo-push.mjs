function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toXml(v) {
  if (v === null || v === undefined) return "<nil/>";
  if (typeof v === "boolean") return `<boolean>${v ? 1 : 0}</boolean>`;
  if (typeof v === "number" && Number.isInteger(v)) return `<int>${v}</int>`;
  if (typeof v === "number") return `<double>${v}</double>`;
  if (typeof v === "string") return `<string>${escXml(v)}</string>`;
  if (Array.isArray(v)) {
    return `<array><data>${v.map((x) => `<value>${toXml(x)}</value>`).join("")}</data></array>`;
  }
  if (typeof v === "object") {
    const members = Object.entries(v)
      .map(([k, val]) => `<member><name>${escXml(k)}</name><value>${toXml(val)}</value></member>`)
      .join("");
    return `<struct>${members}</struct>`;
  }
  return `<string>${escXml(String(v))}</string>`;
}

function buildXmlRpc(method, params) {
  return `<?xml version='1.0'?><methodCall><methodName>${method}</methodName><params>${params.map((p) => `<param><value>${toXml(p)}</value></param>`).join("")}</params></methodCall>`;
}

function extractInt(xml) {
  const m = xml.match(/<(?:int|i4|i8)>(-?\d+)<\/(?:int|i4|i8)>/);
  return m ? parseInt(m[1], 10) : null;
}

function extractArrayInts(xml) {
  return [...xml.matchAll(/<(?:int|i4|i8)>(-?\d+)<\/(?:int|i4|i8)>/g)].map((m) => parseInt(m[1], 10));
}

function checkFault(xml, label) {
  if (!xml.includes("<fault>")) return;
  const m = xml.match(/<name>faultString<\/name>\s*<value>\s*<string>([^<]*)<\/string>/s);
  throw new Error(`Odoo ${label}: ${m?.[1] ?? "erreur inconnue"}`);
}

async function xmlRpcCall(url, method, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: buildXmlRpc(method, params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} depuis Odoo`);
  const text = await res.text();
  checkFault(text, method);
  return text;
}

function parseAddress(address) {
  // Format québécois : "9601, Colbert, Anjou, QC H1J 1Z9"
  if (!address) return { street: "", city: "", zip: "" };
  const zipMatch = address.match(/([A-Z]\d[A-Z]\s*\d[A-Z]\d)\s*$/);
  const zip = zipMatch ? zipMatch[1].replace(/\s/, " ") : "";
  const withoutZip = address.replace(zip, "").trim().replace(/,\s*$/, "");
  const parts = withoutZip.split(",").map((s) => s.trim()).filter(Boolean);
  // Last part often "QC" province, second-to-last is city
  const lastClean = parts[parts.length - 1];
  const isProvince = /^[A-Z]{2}$/.test(lastClean);
  const city = isProvince ? parts[parts.length - 2] ?? "" : lastClean;
  const streetParts = isProvince ? parts.slice(0, -2) : parts.slice(0, -1);
  return { street: streetParts.join(", "), city, zip };
}

function buildDescription(note) {
  return note ? String(note).trim() : "";
}

export async function pushProspectToOdoo(prospect, fields = {}) {
  const { ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY } = process.env;

  if (!ODOO_URL || !ODOO_DB || !ODOO_LOGIN || !ODOO_API_KEY) {
    const err = new Error(
      "Odoo non configuré — ajoute ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY dans .env.local"
    );
    err.statusCode = 503;
    throw err;
  }

  const authXml = await xmlRpcCall(`${ODOO_URL}/xmlrpc/2/common`, "authenticate", [
    ODOO_DB,
    ODOO_LOGIN,
    ODOO_API_KEY,
    {},
  ]);
  const uid = extractInt(authXml);
  if (!uid) throw new Error("Auth Odoo échouée — vérifie ODOO_LOGIN et ODOO_API_KEY");

  const addr = parseAddress(prospect.address ?? "");

  // Valeurs éditées dans le panel priment sur les données CSV
  const company = fields.company?.trim() || prospect.name || "";
  const email = fields.email?.trim() || prospect.email || "";
  const phone = fields.phone?.trim() || prospect.phone || "";
  const website = fields.website?.trim() || prospect.website || "";
  const contact = fields.contact?.trim() || prospect.owner || "";
  const linkedin = fields.linkedin?.trim() || prospect.linkedin || "";
  // Adresse — les champs du formulaire priment sur le parsing automatique
  const street = fields.street?.trim() || addr.street || (prospect.address && !addr.street ? prospect.address : "");
  const city = fields.city?.trim() || addr.city || "";
  const zip = fields.zip?.trim() || addr.zip || "";

  const lead = {
    name: company || "Nouveau lead",
    partner_name: company || "",
    type: "opportunity",
    user_id: uid,
  };
  if (email) lead.email_from = email;
  if (phone) lead.phone = phone;
  if (website) lead.website = website;
  if (contact) lead.contact_name = contact;
  if (street) lead.street = street;
  if (city) lead.city = city;
  if (zip) lead.zip = zip;
  lead.priority = prospect.rawScore >= 8 ? "2" : prospect.rawScore >= 7 ? "1" : "0";

  // Pays + Province : Canada / Québec
  try {
    const [countryXml, stateXml] = await Promise.all([
      xmlRpcCall(`${ODOO_URL}/xmlrpc/2/object`, "execute_kw", [
        ODOO_DB, uid, ODOO_API_KEY,
        "res.country", "search",
        [[["code", "=", "CA"]]],
        { limit: 1 },
      ]),
      xmlRpcCall(`${ODOO_URL}/xmlrpc/2/object`, "execute_kw", [
        ODOO_DB, uid, ODOO_API_KEY,
        "res.country.state", "search",
        [[["code", "=", "QC"]]],
        { limit: 1 },
      ]),
    ]);
    const countryId = extractArrayInts(countryXml)[0];
    const stateId = extractArrayInts(stateXml)[0];
    if (countryId) lead.country_id = countryId;
    if (stateId) lead.state_id = stateId;
  } catch (_) { /* non-bloquant */ }

  // Source CRM : Panel Prospects (crée si absent)
  try {
    const srcSearchXml = await xmlRpcCall(`${ODOO_URL}/xmlrpc/2/object`, "execute_kw", [
      ODOO_DB, uid, ODOO_API_KEY,
      "utm.source", "search",
      [[["name", "=", "Panel Prospects"]]],
      { limit: 1 },
    ]);
    let sourceId = extractArrayInts(srcSearchXml)[0];
    if (!sourceId) {
      const srcCreateXml = await xmlRpcCall(`${ODOO_URL}/xmlrpc/2/object`, "execute_kw", [
        ODOO_DB, uid, ODOO_API_KEY,
        "utm.source", "create",
        [[{ name: "Panel Prospects" }]],
        {},
      ]);
      sourceId = extractInt(srcCreateXml);
    }
    if (sourceId) lead.source_id = sourceId;
  } catch (_) { /* non-bloquant */ }

  // Notes Odoo = uniquement la note manuelle saisie dans le panel
  const note = fields.note?.trim() || "";
  if (note) lead.description = note;

  // Contexte structuré → note interne du chatter après création
  const contextLines = [];
  if (prospect.sector) contextLines.push(`Secteur : ${prospect.sector}`);
  if (prospect.size) contextLines.push(`Taille : ${prospect.size}`);
  if (linkedin) contextLines.push(`LinkedIn : ${linkedin}`);
  if (prospect.angle) contextLines.push(`Angle d'attaque : ${prospect.angle}`);
  if (prospect.signal) contextLines.push(`Signal : ${prospect.signal}`);
  if (prospect.rawScore) contextLines.push(`Score panel : ${prospect.rawScore}/10`);
  if (prospect.batch) contextLines.push(`Batch : ${prospect.batch.replace("BATCH_", "")}`);

  // Étiquette industrie : cherche ou crée le tag crm.tag
  const tagName = fields.tag?.trim();
  if (tagName) {
    const searchXml = await xmlRpcCall(`${ODOO_URL}/xmlrpc/2/object`, "execute_kw", [
      ODOO_DB, uid, ODOO_API_KEY,
      "crm.tag", "search",
      [[["name", "=", tagName]]],
      { limit: 1 },
    ]);
    const existing = extractArrayInts(searchXml);
    let tagId = existing[0];
    if (!tagId) {
      const createTagXml = await xmlRpcCall(`${ODOO_URL}/xmlrpc/2/object`, "execute_kw", [
        ODOO_DB, uid, ODOO_API_KEY,
        "crm.tag", "create",
        [[{ name: tagName }]],
        {},
      ]);
      tagId = extractInt(createTagXml);
    }
    if (tagId) lead.tag_ids = [[4, tagId]];
  }

  // Revenu attendu (Odoo 17+ : expected_revenue)
  if (fields.revenue) {
    const rev = parseFloat(fields.revenue);
    if (!isNaN(rev) && rev > 0) lead.expected_revenue = rev;
  }

  const createXml = await xmlRpcCall(`${ODOO_URL}/xmlrpc/2/object`, "execute_kw", [
    ODOO_DB,
    uid,
    ODOO_API_KEY,
    "crm.lead",
    "create",
    [[lead]],
    {},
  ]);
  const leadId = extractInt(createXml);
  if (!leadId) throw new Error("Création lead Odoo échouée — réponse inattendue");

  // Poster le contexte structuré comme note interne dans le chatter
  if (contextLines.length > 0) {
    const chatBody = `<p><strong>📋 Contexte prospect (Panel)</strong></p><p>${contextLines.join("<br/>")}</p>`;
    try {
      await xmlRpcCall(`${ODOO_URL}/xmlrpc/2/object`, "execute_kw", [
        ODOO_DB, uid, ODOO_API_KEY,
        "crm.lead", "message_post",
        [[leadId]],
        { body: chatBody, message_type: "comment", subtype_xmlid: "mail.mt_note" },
      ]);
    } catch (_) { /* non-bloquant */ }
  }

  return { leadId };
}
