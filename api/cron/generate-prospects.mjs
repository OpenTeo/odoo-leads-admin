const PROSPECTS_BLOB_KEY = "odoo-leads-admin/prospects-latest.json";

const DEMO_PROSPECTS = [
  {
    name: "Menuiserie Beauchamp inc.",
    sector: "Manufacturier / fabrication sur mesure",
    owner: "Jean-François Beauchamp",
    email: "",
    rawScore: 8.2,
    sources: "Google Maps, LinkedIn",
    angle: "Gestion de projets et suivi de production manuelle — Excel partout",
    signal: "Recrutement actif technicien usinage",
    website: "menuiseriebeauchamp.ca",
    size: "11-50",
    address: "Saint-Hyacinthe, QC",
    linkedin: ""
  },
  {
    name: "Distributions Oméga ltée",
    sector: "Distribution industrielle / MRO",
    owner: "Marie-Claude Gagnon",
    email: "mcgagnon@omega-dist.ca",
    rawScore: 8.7,
    sources: "BonLib, site web",
    angle: "Inventaire multi-entrepôts non centralisé, bons de commande papier",
    signal: "Expansion entrepôt Laval 2026",
    website: "omega-dist.ca",
    size: "11-50",
    address: "Laval, QC",
    linkedin: "https://www.linkedin.com/in/marie-claude-gagnon"
  },
  {
    name: "Protec Incendie Solutions",
    sector: "Protection incendie / sécurité",
    owner: "Sylvain Tremblay",
    email: "",
    rawScore: 7.9,
    sources: "LinkedIn, Régie du bâtiment",
    angle: "Planification interventions terrain sur feuilles volantes, aucun CRM",
    signal: "Ouverture bureau Québec City",
    website: "protecincendie.ca",
    size: "11-50",
    address: "Lévis, QC",
    linkedin: ""
  },
  {
    name: "Génie Conseil Norois inc.",
    sector: "Génie-conseil / ingénierie structurale",
    owner: "Patrick Lachance",
    email: "plachance@norois.com",
    rawScore: 8.4,
    sources: "BonLib, Google",
    angle: "Suivi de projets multi-chantiers dans des fichiers partagés OneDrive",
    signal: "Nouveau contrat municipal Saguenay",
    website: "norois.com",
    size: "11-50",
    address: "Chicoutimi, QC",
    linkedin: "https://www.linkedin.com/in/patrick-lachance-ing"
  },
  {
    name: "Réfrigération Côte-Nord enr.",
    sector: "Réfrigération / froid commercial",
    owner: "Bruno Simard",
    email: "bsimard@refrigeration-cotenord.ca",
    rawScore: 7.5,
    sources: "Site web, Pages Jaunes",
    angle: "Gestion contrats entretien sur papier, aucune traçabilité client",
    signal: "Recrutement technicien réfrigération",
    website: "refrigeration-cotenord.ca",
    size: "11-50",
    address: "Baie-Comeau, QC",
    linkedin: ""
  },
  {
    name: "Construction Vaillancourt & Fils",
    sector: "Construction / entrepreneur général",
    owner: "Stéphane Vaillancourt",
    email: "",
    rawScore: 7.2,
    sources: "RBQ, BonLib",
    angle: "Coordination sous-traitants et appels d'offres entièrement par courriel",
    signal: "Projet résidentiel 40 unités Drummondville",
    website: "constructionvaillancourt.com",
    size: "11-50",
    address: "Drummondville, QC",
    linkedin: ""
  },
  {
    name: "Agroalimentaire Saveurs du Nord",
    sector: "Distribution alimentaire / agroalimentaire",
    owner: "Isabelle Fortin",
    email: "ifortin@saveursdunord.ca",
    rawScore: 8.0,
    sources: "LinkedIn, MAPAQ",
    angle: "Gestion lots et traçabilité produits frais encore manuelle",
    signal: "Certification BRC en cours, besoin de traçabilité urgente",
    website: "saveursdunord.ca",
    size: "11-50",
    address: "Saint-Félicien, QC",
    linkedin: "https://www.linkedin.com/in/isabelle-fortin-agro"
  }
];

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "missing_blob_token" });
  }

  try {
    const { put } = await import("@vercel/blob");
    await put(PROSPECTS_BLOB_KEY, JSON.stringify(DEMO_PROSPECTS, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8",
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log(`[cron/generate-prospects] done: ${DEMO_PROSPECTS.length} prospects written to blob`);
    res.status(200).json({ ok: true, count: DEMO_PROSPECTS.length });
  } catch (err) {
    console.error("[cron/generate-prospects] error:", err.message);
    res.status(500).json({ error: "generate_failed", detail: err.message });
  }
}
