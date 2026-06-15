#!/usr/bin/env node
/**
 * Lit tous les batches CSV (snapshot + workspace) et pousse vers Vercel Blob.
 * Usage: node scripts/push-prospects-to-blob.mjs
 */

import { put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROSPECTS_BLOB_KEY = "odoo-leads-admin/prospects-latest.json";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const workspaceRoot = path.dirname(path.dirname(projectRoot));

const snapshotRoot = path.join(projectRoot, "snapshot/CLIENTS_01_LEADS");
const workspaceLeadsRoot = path.join(workspaceRoot, "CLIENTS/01_LEADS");
const leadsRoot = fs.existsSync(workspaceLeadsRoot) ? workspaceLeadsRoot : snapshotRoot;

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const next = line[i + 1];
    if (c === '"' && inQuotes && next === '"') { current += '"'; i++; continue; }
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === "," && !inQuotes) { result.push(current); current = ""; continue; }
    current += c;
  }
  result.push(current);
  return result;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function cleanValue(v) {
  const t = String(v ?? "").trim();
  if (!t) return "";
  const l = t.toLowerCase();
  if (l === "à vérifier" || l.startsWith("à trouver") || l.startsWith("a trouver")) return "";
  return t;
}

function scoreToNumber(v) {
  // handles "7.3", "7.3/10", "8/15"
  const str = String(v).replace(",", ".");
  const slashIdx = str.indexOf("/");
  if (slashIdx > 0) {
    const num = parseFloat(str.slice(0, slashIdx));
    const den = parseFloat(str.slice(slashIdx + 1));
    if (isFinite(num) && isFinite(den) && den > 0) return parseFloat((num / den * 10).toFixed(2));
  }
  const n = parseFloat(str);
  return isFinite(n) ? n : 0;
}

function rowToProspect(row) {
  return {
    name: cleanValue(row["Nom entreprise"] || row["Nom"] || ""),
    website: cleanValue(row["Site web"] || ""),
    address: cleanValue(row["Adresse"] || ""),
    size: row["Taille estimée"] ?? "",
    sector: row["Secteur (SCIAN approx)"] || row["Secteur (SCIAN)"] || row["Secteur"] || "",
    owner: cleanValue(row["Nom du dirigeant"] || row["Dirigeant"] || ""),
    linkedin: cleanValue(row["LinkedIn dirigeant"] || ""),
    email: cleanValue(row["Email pro"] || row["Email"] || ""),
    phone: cleanValue(row["Téléphone"] || ""),
    rawScore: scoreToNumber(row["Score /10"] || row["Score"] || ""),
    angle: row["Angle d'attaque"] ?? "",
    signal: row["Signal timing"] ?? "",
    sources: row["Source(s)"] || row["Source"] || "",
  };
}

function readBatches(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("BATCH_"))
    .map((e) => e.name)
    .sort()
    .reverse();
}

// June 15 batch hardcoded (deleted from filesystem, read via git show earlier)
const BATCH_2026_06_15_CSV = `Nom,Site web,Adresse,Taille estimée,Secteur,Dirigeant,Email,Téléphone,Score,Angle d'attaque,Signal timing,Source
Équipe SP,equipesp.com,"Longueuil, QC J4G 2R8 (Rive-Sud)","~15-25 employés — Source: site web — Confiance: FAIBLE-MOYENNE",Génie du bâtiment (mécanique + électricité du bâtiment),À identifier,À vérifier,À vérifier,8/15,"Vous avez repris la firme avec une vision de croissance. Vos projets sont gérés dans 4-5 outils séparés. Odoo unifie devis → feuilles de temps → facturation.","Acquisition récente par les associés actuels + recrutement actif ingénieur mécanique (juin 2026)","equipesp.com, equipesp.com/carrieres/"
Motair,motair.ca,"Saint-Laurent / Laval / Longueuil QC (3 succursales)","~20-35 employés — Source: 3 succursales opérationnelles — Confiance: FAIBLE-MOYENNE",Distribution grossiste spécialisée (moteurs électriques + pièces HVAC + réfrigération + industriel),À identifier,À vérifier,À vérifier,7/15,"Avec 3 succursales, votre inventaire ne se synchronise probablement pas. Odoo unifie votre stock en temps réel.","3 succursales Grand Montréal — coordination inventaire multi-sites sans ERP centralisé probable",motair.ca
Secam International,secam.ca,"Laval, QC","~15-30 employés — Source: 4000+ clients servis — Confiance: FAIBLE",Courtage en douane + transit international + transport + entrepôt,À identifier,À vérifier,À vérifier,7/15,"Vous gérez dédouanement + entrepôt + facturation dans des systèmes séparés. Odoo centralise votre WMS sans toucher vos logiciels douaniers.","Entreprise familiale en opération depuis 1985 — probable transition générationnelle",secam.ca
Impression Rive-Sud,impression-rivesud.com,"Rive-Sud de Montréal, QC","~20-40 employés — Source: 22+ équipements de finition — Confiance: FAIBLE-MOYENNE",Imprimerie commerciale (prépresse + offset + numérique + grand format + finition),À identifier,À vérifier,À vérifier,7/15,"Votre cycle devis → production → livraison → facturation passe par plusieurs systèmes. Odoo connecte ce flux bout en bout.","22+ équipements de finition = volume opérationnel croissant; recrutement actif","impression-rivesud.com, impression-rivesud.com/carrieres/"`;

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("❌ BLOB_READ_WRITE_TOKEN manquant. Ajouter dans .env.local ou l'environnement.");
    process.exit(1);
  }

  const allProspects = [];

  // June 15 batch (hardcoded, deleted from filesystem)
  const june15Rows = parseCsv(BATCH_2026_06_15_CSV);
  const june15Prospects = june15Rows.map(rowToProspect).filter((p) => p.name);
  console.log(`📦 BATCH_2026-06-15 (git): ${june15Prospects.length} prospects`);
  allProspects.push(...june15Prospects);

  // All other batches from filesystem
  const batchDirs = readBatches(leadsRoot);
  for (const batchName of batchDirs) {
    const csvPath = path.join(leadsRoot, batchName, "prospects.csv");
    if (!fs.existsSync(csvPath)) continue;
    const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
    const prospects = rows.map(rowToProspect).filter((p) => p.name);
    console.log(`📦 ${batchName}: ${prospects.length} prospects`);
    allProspects.push(...prospects);
  }

  // Dedupe by name (simple — dashboard does proper dedup)
  const seen = new Set();
  const deduped = allProspects.filter((p) => {
    const key = p.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n✅ Total après dédup: ${deduped.length} prospects`);
  console.log("⬆️  Push vers Vercel Blob...");

  await put(PROSPECTS_BLOB_KEY, JSON.stringify(deduped, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    token,
  });

  console.log(`✅ Blob mis à jour : ${PROSPECTS_BLOB_KEY}`);
  console.log("🔄 Le dashboard affichera les nouveaux prospects au prochain refresh.");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
