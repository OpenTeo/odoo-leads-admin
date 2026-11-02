# Batch Prospects — 2 novembre 2026 (session 2: CVAC/usinage/génie/impression)

**Généré par:** Routine automatique `prospect-hunter-weekly`  
**Session:** Mon 2026-11-02 12:15 UTC  
**Méthode:** WebSearch (mode extended) — recherche réelle sur sources publiques québécoises

## Résultats : 10 prospects qualifiés

| Nom | Secteur | Ville | Score |
|-----|---------|-------|-------|
| Groupe Soteck | CVAC / Mécanique bâtiment industriel | Montréal + 3 bureaux | 7.8 |
| Le Groupe-Conseil Génipur | Génie-conseil civil | Brossard | 7.5 |
| Usinage Richelieu | Usinage précision | Sainte-Victoire-de-Sorel | 7.5 |
| Bâtivac | CVAC / Mécanique bâtiment | Ville Saint-Laurent | 7.5 |
| Protection Incendie Unik | Protection incendie | Montréal | 7.5 |
| G.M. Précision | Usinage CNC / Aérospatiale | Région Mtl–Sherbrooke | 7.0 |
| Fabrication ML | Fabrication métallique | Québec | 7.0 |
| ThermoClim | CVAC / Réfrigération | Québec + Lévis | 6.8 |
| Sérigraphie CME | Imprimerie / Sérigraphie | Montréal | 6.8 |
| Studio Intik | Impression textile / DTF | Montréal | 6.8 |

**Seuil appliqué :** ≥ 6.5/10  
**Distribution :** 5× CHAUD (≥7.5) · 2× CHAUD (7.0) · 3× TIÈDE (6.8)

## Secteurs représentés

- **CVAC/Mécanique bâtiment :** Groupe Soteck, Bâtivac, ThermoClim (3)
- **Usinage/Fabrication métallique :** Usinage Richelieu, G.M. Précision, Fabrication ML (3)
- **Génie-conseil/Ingénierie :** Le Groupe-Conseil Génipur (1)
- **Protection incendie :** Protection Incendie Unik (1)
- **Imprimerie/Sérigraphie :** Sérigraphie CME, Studio Intik (2)

## Statut push vers dashboard

**⚠️ NON POUSSÉ** — Politique réseau de la session bloque `odoo-leads-admin.vercel.app:443`

### Action manuelle pour pousser ces prospects vers le dashboard

```bash
curl -s -X POST https://odoo-leads-admin.vercel.app/api/cron/generate-prospects \
  -H "Content-Type: application/json" \
  -d "{\"leads\": $(cat snapshot/CLIENTS_01_LEADS/BATCH_2026-11-02_CVAC_USINAGE/prospects-api.json)}"
```

## Prospects exclus (raisons)

- Nitek Laser — trop grande (175+ emp, hors ICP)
- Matritech — trop grande (127 emp)
- Guard-X — trop grande (51-200 emp, possiblement >35)
- MDI — déjà client Odoo confirmé
- GNR Corbus — ~100 emp, hors fourchette ICP
- BAULNE — 76-100 emp, hors fourchette ICP
