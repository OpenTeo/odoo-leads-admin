# Batch Prospects Odoo — 2026-10-19 (Manufacturier / CVAC / Distribution)
**Période :** Octobre 2026 | **Secteurs prioritaires :** Usinage CNC, CVAC/mécanique bâtiment, Distribution industrielle & alimentaire, Imprimerie

---

## Résumé exécutif

- **Total prospects trouvés :** 10 PME qualifiées (score ≥ 7.0)
- **Chauds (≥ 8.0) :** 5 prospects avec signaux forts
- **Bons fits (7.0–7.9) :** 5 prospects secteur ICP solide
- **Score moyen :** 7.65/10

---

## Top 5 prioritaires cette semaine

1. **Atelier d'usinage Côté & Audet inc.** (Sorel-Tracy) — Score 8.5/10 🔥
   4M$ de financement gouvernemental (jan 2026) pour expansion. Recrutement machinist-programmeur + chargé projets actif. Moment idéal pour ERP.

2. **Usinage Marcotte** (Val-d'Or / East Angus) — Score 8.0/10 🔥
   Multiples subventions DEC (2021→2025), 2 usines, expansion continue confirmée.

3. **Quéloz & Associés inc.** (Québec) — Score 8.0/10 🔥
   CNC aéronautique, ~30 emp, ISO 9001 + AS9100, équipement Mazak haut de gamme.

4. **Climatisation Bâtivac inc.** (Ville Saint-Laurent) — Score 8.0/10 🔥
   CVAC/mécanique bâtiment ICI, projets REM + Maisons des aînés, BIM, LEED.

5. **DMB Distribution Alimentaire** (Saint-Augustin-de-Desmaures) — Score 8.0/10 🔥
   Distribution alimentaire B2B, 2 entrepôts, 9000 livraisons/semaine, acquisition Doctor Deli 2020.

---

## Tendances observées

- **Expansion manufacturière active** : Côté & Audet et Marcotte ont tous deux reçu du financement gouvernemental DEC récent pour acquisition d'équipements — c'est le timing idéal pour proposer un ERP (la croissance crée des douleurs opérationnelles immédiates).
- **CVAC/mécanique bâtiment** : Bâtivac (grands projets publics + BIM) et RL Climatisation (recrutement double) sont en phase de structuration. Secteur avec complexité timesheets + projets + sous-traitants = besoin ERP naturel.
- **Distribution industrielle / alimentaire** : MDI et DMB sont des PME à multi-catégories avec des besoins clairs en gestion multi-entrepôts et automatisation des commandes.
- **Usinage CNC** : Quéloz (aéro), Gagné (multi-capacités), DDR (CNC+tôlerie) — secteur où la gestion des ordres de fabrication et la traçabilité qualité sont des points de douleur majeurs.

---

## Note technique

**Push Vercel Blob NON effectué** — `BLOB_READ_WRITE_TOKEN` absent de l'environnement de la tâche planifiée, et la connexion directe à `odoo-leads-admin.vercel.app` est bloquée par la politique réseau du proxy de la session cloud.

**Pour pousser manuellement :**
```bash
BLOB_READ_WRITE_TOKEN=<token> node scripts/push-prospects-to-blob.mjs
```

Les données sont disponibles dans ce batch Git : `snapshot/CLIENTS_01_LEADS/BATCH_2026-10-19_MANUFACTURING/prospects.csv`

---

## Sources principales utilisées
- Axya Supplier Directory (usinage CNC Québec)
- Développement économique Canada / DEC (subventions 2024-2026)
- Aéro Montréal (profils entreprises aérospatial Québec)
- Jobillico / Job Bank / SimplyHired / Workopolis (offres emploi)
- Desjardins Capital (portfolio partenaires)
- Cégep Ahuntsic (document journée carrière Bâtivac)
- Archeti (profil MDI)
