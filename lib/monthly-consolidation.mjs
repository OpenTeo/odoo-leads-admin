import fs from "node:fs";
import path from "node:path";
import { projectRoot, overridesPath, preferencesPath, collectDashboardData } from "./dashboard-data.mjs";

const monthlyStatePath = path.join(projectRoot, "data/monthly-state.json");

// Mapping sectorGroup → ruleId (pour ajuster les bonnes règles)
const SECTOR_GROUP_TO_RULE = {
  "Architecture":                    "architecture",
  "Réfrigération / froid":           "engineering",
  "Protection incendie / sécurité":  "engineering",
  "Génie-conseil / ingénierie":      "engineering",
  "CVAC / mécanique bâtiment":       "engineering",
  "Manufacturier / industrie":       "operations",
  "Distribution alimentaire":        "operations",
  "Distribution industrielle":       "operations",
  "Comptabilité / finance":          "accounting",
  "Agence marketing / web":          "marketing",
  "Développement / e-commerce":      "tech",
  "Conseil / services professionnels":"generic_services"
};

const MAX_DELTA_CHANGE_PER_MONTH = 0.25;
const MIN_SIGNAL = 2; // décisions minimum pour ajuster une règle

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function isNewMonth(lastRunIso) {
  if (!lastRunIso) return true;
  const lastRun = new Date(lastRunIso);
  const now = new Date();
  return lastRun.getFullYear() !== now.getFullYear() || lastRun.getMonth() !== now.getMonth();
}

export function shouldConsolidate() {
  const state = readJson(monthlyStatePath, {});
  return isNewMonth(state.lastRun);
}

export function runMonthlyConsolidation() {
  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  console.log(`[monthly] Consolidation ${monthLabel}...`);

  // ── 1. Collecter données complètes (prospects + overrides fusionnés) ──────
  let data;
  try {
    data = collectDashboardData();
  } catch (err) {
    console.error("[monthly] Impossible de lire les données:", err.message);
    return;
  }

  const overrides = readJson(overridesPath, { prospects: {} });
  const preferences = readJson(preferencesPath, null);
  if (!preferences) {
    console.error("[monthly] Pas de fichier scoring-preferences.json");
    return;
  }

  // ── 2. Analyser les décisions humaines du mois écoulé ─────────────────────
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const prospectIndex = Object.fromEntries(data.prospects.map((p) => [p.id, p]));

  const ruleApprovals = {};  // ruleId → count
  const ruleRejections = {}; // ruleId → count
  let approvedTotal = 0;
  let rejectedTotal = 0;

  for (const [id, override] of Object.entries(overrides.prospects || {})) {
    if (override.autoRejected) continue;
    const updatedAt = override.updatedAt ? new Date(override.updatedAt).getTime() : 0;
    if (updatedAt < thirtyDaysAgo) continue;

    const prospect = prospectIndex[id];
    if (!prospect) continue;

    const ruleId = SECTOR_GROUP_TO_RULE[prospect.sectorGroup];
    if (!ruleId) continue;

    if (override.decision === "odoo_done" || override.decision === "approved") {
      ruleApprovals[ruleId] = (ruleApprovals[ruleId] || 0) + 1;
      approvedTotal++;
    } else if (override.decision === "bad_fit" || override.decision === "rejected") {
      ruleRejections[ruleId] = (ruleRejections[ruleId] || 0) + 1;
      rejectedTotal++;
    }
  }

  // ── 3. Ajuster les deltas des sectorRules ──────────────────────────────────
  const rulesUpdated = [];
  const updatedRules = (preferences.sectorRules || []).map((rule) => {
    const approvals = ruleApprovals[rule.id] || 0;
    const rejections = ruleRejections[rule.id] || 0;
    const total = approvals + rejections;
    if (total < MIN_SIGNAL) return rule; // pas assez de signal

    const approvalRate = approvals / total;
    let adjustment = 0;

    if (approvalRate >= 0.8) {
      adjustment = MAX_DELTA_CHANGE_PER_MONTH;        // fort signal positif
    } else if (approvalRate >= 0.6) {
      adjustment = MAX_DELTA_CHANGE_PER_MONTH * 0.5;  // signal positif modéré
    } else if (approvalRate <= 0.2) {
      adjustment = -MAX_DELTA_CHANGE_PER_MONTH;       // fort signal négatif
    } else if (approvalRate <= 0.4) {
      adjustment = -MAX_DELTA_CHANGE_PER_MONTH * 0.5; // signal négatif modéré
    }

    if (adjustment === 0) return rule;

    const oldDelta = rule.delta;
    const newDelta = Math.max(-3.5, Math.min(2.5, oldDelta + adjustment));
    rulesUpdated.push({ id: rule.id, label: rule.label, oldDelta, newDelta, approvals, rejections });
    return { ...rule, delta: Math.round(newDelta * 100) / 100 };
  });

  // ── 4. Sauvegarder les préférences mises à jour ────────────────────────────
  if (rulesUpdated.length > 0) {
    const updatedPrefs = {
      ...preferences,
      sectorRules: updatedRules,
      lastConsolidation: now.toISOString()
    };
    fs.writeFileSync(preferencesPath, JSON.stringify(updatedPrefs, null, 2), "utf8");
    console.log(`[monthly] ${rulesUpdated.length} règles sectorielles recalibrées`);
    rulesUpdated.forEach((r) => {
      console.log(`  ${r.label}: ${r.oldDelta.toFixed(2)} → ${r.newDelta.toFixed(2)} (${r.approvals}✓ ${r.rejections}✗)`);
    });
  } else {
    console.log("[monthly] Pas assez de signal pour recalibrer les règles ce mois-ci");
  }

  // ── 5. Archiver les prospects décidés (odoo_done / bad_fit) ───────────────
  // On ajoute archivedAt sans supprimer l'override (reste excluded)
  let archivedCount = 0;
  const archiveEntries = {};

  for (const [id, override] of Object.entries(overrides.prospects || {})) {
    if (override.archivedAt) continue; // déjà archivé
    if (override.decision !== "odoo_done" && override.decision !== "bad_fit") continue;

    const prospect = prospectIndex[id];
    overrides.prospects[id] = { ...override, archivedAt: now.toISOString() };
    archiveEntries[id] = {
      ...override,
      archivedAt: now.toISOString(),
      name: prospect?.name || id,
      sectorGroup: prospect?.sectorGroup || "",
      score: prospect?.scoreValue || 0
    };
    archivedCount++;
  }

  if (archivedCount > 0) {
    const archivePath = path.join(projectRoot, `data/archive-${monthLabel}.json`);
    fs.writeFileSync(archivePath, JSON.stringify({
      month: monthLabel,
      generatedAt: now.toISOString(),
      count: archivedCount,
      prospects: archiveEntries
    }, null, 2), "utf8");
    fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), "utf8");
    console.log(`[monthly] ${archivedCount} prospects archivés → archive-${monthLabel}.json`);
  }

  // ── 6. Écrire le résumé mensuel ────────────────────────────────────────────
  const summary = {
    lastRun: now.toISOString(),
    month: monthLabel,
    decisionsAnalyzed: approvedTotal + rejectedTotal,
    approvedTotal,
    rejectedTotal,
    archivedCount,
    rulesUpdated: rulesUpdated.map((r) => ({
      id: r.id,
      label: r.label,
      change: Math.round((r.newDelta - r.oldDelta) * 100) / 100,
      direction: r.newDelta > r.oldDelta ? "boosted" : "penalized"
    }))
  };

  fs.writeFileSync(monthlyStatePath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`[monthly] Consolidation ${monthLabel} terminée.`);
  return summary;
}
