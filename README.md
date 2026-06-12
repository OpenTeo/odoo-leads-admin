# Odoo Leads Admin

Panel admin statique pour qualifier la prospection Odoo de Téo en local, sans chercher à remplacer le CRM opérationnel.

## Ce que le panel couvre

- `Overview` : KPIs globaux, pipeline estimé, lecture qualité/contactabilité
- `Prospects` : recherche, filtres, liens rapides de vérification, détail prospect, lecture batch
- `Automatisations` : monitoring des flows de sourcing, scoring, enrichissement et suivi
- `Événements` : salons et opportunités terrain à surveiller pour prospecter

## Ouvrir le panel interactif

```bash
node /Users/money/.openclaw/workspace/PROJECTS/ODOO_LEADS_ADMIN/scripts/server.mjs
```

Puis ouvrir :

- <http://127.0.0.1:4311>

Ce mode permet :

- d'écarter un prospect sans supprimer le CSV source
- de laisser une note persistante de qualification
- de réintégrer un prospect plus tard
- de faire apprendre le tri au panel via les décisions de qualification enregistrées

Les données locales de pilotage sont stockées dans :

- `PROJECTS/ODOO_LEADS_ADMIN/data/prospect-overrides.json`
- `PROJECTS/ODOO_LEADS_ADMIN/data/scoring-preferences.json`

## Régénérer le dashboard

```bash
node /Users/money/.openclaw/workspace/PROJECTS/ODOO_LEADS_ADMIN/scripts/build-dashboard.mjs
```

Fichier généré :

- `PROJECTS/ODOO_LEADS_ADMIN/dist/index.html`

## Sources de données

Leads :
- `CLIENTS/01_LEADS/BATCH_*/prospects.csv`
- `CLIENTS/01_LEADS/*/fiche.md`
- `CLIENTS/01_LEADS/BATCH_*/summary.md`

Monitoring :
- `PROJECTS/ODOO_LEADS_ADMIN/data/automations.json`
- `PROJECTS/ODOO_LEADS_ADMIN/data/events.json`

## Notes

- Les métriques business affichées sont des estimations locales dérivées du score et de la taille des prospects.
- `automations.json` et `events.json` sont faits pour être enrichis au fil de la vraie mise en place des flows et de la veille salons.
