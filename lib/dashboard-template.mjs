function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildHtml(snapshot) {
  const initialData = JSON.stringify(snapshot);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Odoo Leads Admin</title>
  <style>
    :root {
      --bg: #f5f4f6;
      --sidebar: #714B67;
      --sidebar-line: rgba(255,255,255,0.12);
      --panel: #ffffff;
      --ink: #1c1c28;
      --muted: #888eab;
      --line: rgba(0, 0, 0, 0.08);
      --accent: #714B67;
      --accent-2: #00A09D;
      --accent-soft: rgba(113, 75, 103, 0.10);
      --good: #017E84;
      --warn: #e07b39;
      --danger: #d0405a;
      --shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
      --radius: 16px;
      --font-heading: "Inter", "Segoe UI", system-ui, sans-serif;
      --font-body: "Inter", "Segoe UI", system-ui, sans-serif;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--font-body);
      color: var(--ink);
      background: #f5f4f6;
    }

    button, input, select, textarea { font: inherit; }
    a { color: inherit; }
    textarea { resize: vertical; }

    .app-shell {
      width: min(1560px, calc(100vw - 32px));
      margin: 18px auto 28px;
      display: grid;
      gap: 0;
    }

    /* ── Top header ───────────────────────────────── */
    .top-header {
      background: #714B67;
      color: rgba(255,255,255,0.95);
      border-radius: 16px 16px 0 0;
      padding: 0 20px;
      min-height: 60px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: sticky;
      top: 18px;
      z-index: 20;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    }

    .brand-inline {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-right: 18px;
      border-right: 1px solid rgba(255,255,255,0.10);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .brand-mark {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.24);
      display: grid;
      place-items: center;
      font-family: var(--font-heading);
      font-size: 20px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .brand-inline small { font-size: 10px; color: rgba(255,255,255,0.48); display: block; line-height: 1.2; }
    .brand-inline h1 { margin: 0; font: 700 17px/1 var(--font-heading); letter-spacing: -0.01em; }

    /* ── Horizontal tab nav ───────────────────────── */
    .tab-nav {
      display: flex;
      gap: 2px;
      align-items: center;
      flex: 1;
    }
    .tab-button {
      border: 0;
      cursor: pointer;
      border-radius: 12px;
      background: transparent;
      padding: 9px 14px;
      color: rgba(255,255,255,0.66);
      white-space: nowrap;
      transition: background 0.12s, color 0.12s;
    }
    .tab-button strong { display: block; font-size: 14px; font-weight: 600; }
    .tab-button span { display: none; }
    .tab-button:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
    .tab-button.active { background: rgba(255,255,255,0.13); color: white; }

    .header-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }

    /* ── Stats strip below header ─────────────────── */
    .stats-strip {
      background: #ffffff;
      border: 1px solid var(--line);
      border-top: 0;
      border-radius: 0 0 16px 16px;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .stats-strip .stat-item { display: grid; gap: 1px; }
    .stats-strip .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); font-weight: 600; }
    .stats-strip .stat-value { font-size: 22px; font-weight: 800; line-height: 1; font-family: var(--font-heading); }
    .stats-strip .stat-sub { font-size: 10px; color: var(--muted); }
    .stats-strip .stat-divider { width: 1px; height: 36px; background: var(--line); }
    .learning-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .learning-item { font-size: 12px; color: var(--muted); background: var(--accent-soft); border-radius: 8px; padding: 3px 8px; }

    /* ── Sidebar legacy (hidden) ──────────────────── */
    .sidebar { display: none; }
    .sidebar-title { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }

    .main { min-width: 0; display: grid; gap: 18px; }

    .hero {
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 26px 28px;
      position: relative;
      overflow: hidden;
    }

    .eyebrow {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero-head {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: start;
      margin-top: 14px;
    }

    .hero h2 {
      margin: 0;
      font: 700 clamp(34px, 4vw, 56px)/0.96 var(--font-heading);
      max-width: 10ch;
    }

    .hero p {
      margin: 12px 0 0;
      max-width: 66ch;
      color: var(--muted);
      line-height: 1.55;
      font-size: 16px;
    }

    .hero-meta { text-align: right; color: var(--muted); font-size: 14px; min-width: 220px; }
    .refresh-btn {
      margin-top: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 14px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.9);
      color: var(--ink);
      font-size: 13px;
      cursor: pointer;
    }
    .refresh-btn:hover { background: white; border-color: rgba(143,62,105,0.25); }
    .refresh-btn:disabled { opacity: 0.5; cursor: wait; }
    .refresh-btn.refreshing { color: var(--accent); }
    .stats-grid, .card-grid, .overview-grid, .automation-grid, .events-grid, .playbook-grid, .events-summary-grid { display: grid; gap: 14px; }
    .stats-grid { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-top: 22px; }
    .overview-grid { grid-template-columns: 1.2fr 0.8fr; }
    .card-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .automation-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .events-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    .playbook-grid { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    .events-summary-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 18px;
      min-width: 0;
    }

    .stat-card strong { display: block; font-size: 30px; line-height: 1; margin-bottom: 8px; }
    .stat-card small { color: var(--muted); display: block; margin-top: 6px; line-height: 1.45; }

    .section-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
    }

    .section-head h3, .section-head h4, .summary-box h3, .summary-box h4 {
      margin: 0;
      font-family: var(--font-heading);
    }

    .section-head h3 { font-size: 28px; }
    .section-head h4 { font-size: 22px; }
    .section-subtext, .summary-box p, .summary-box li { color: var(--muted); line-height: 1.5; }
    .tab-panel { display: none; }
    .tab-panel.active { display: grid; gap: 18px; }

    .bar-list { display: grid; gap: 12px; }
    .bar-row { display: grid; gap: 6px; }
    .bar-row header, .meta-line {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 14px;
    }

    .bar-track {
      height: 10px;
      border-radius: 999px;
      background: rgba(113, 75, 103, 0.08);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--accent), var(--accent-2));
    }

    .pill-row, .links-row, .action-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 7px 11px;
      border-radius: 999px;
      font-size: 12px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.86);
    }

    .status-active { color: var(--good); }
    .status-warning { color: var(--warn); }
    .status-error { color: var(--danger); }

    .prospect-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 16px;
      align-items: start;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: end;
      margin-bottom: 14px;
    }

    .toolbar-group {
      display: grid;
      gap: 5px;
      min-width: 140px;
      flex: 1 1 170px;
    }

    .toolbar .grow { flex: 2 1 280px; }
    .toolbar label, .detail-item strong { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
    .toolbar input, .toolbar select {
      width: 100%;
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      color: var(--ink);
    }

    .segmented {
      display: inline-flex;
      padding: 3px;
      gap: 3px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid var(--line);
    }

    .segmented button {
      border: 0;
      border-radius: 999px;
      background: transparent;
      cursor: pointer;
      padding: 9px 14px;
      color: var(--muted);
    }

    .segmented button.active { background: var(--accent); color: white; }
    .prospect-list { display: grid; gap: 12px; overflow-y: auto; padding-right: 2px; }

    .prospect-card {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #ffffff;
      padding: 14px 16px;
      cursor: pointer;
      transition: border-color 0.12s, box-shadow 0.12s;
    }

    .prospect-card.is-excluded { opacity: 0.68; }
    .prospect-card:hover, .prospect-card.active { border-color: rgba(113, 75, 103, 0.4); background: #fff; box-shadow: 0 2px 8px rgba(113,75,103,0.08); }
    .prospect-card header { display: flex; justify-content: space-between; gap: 12px; align-items: start; margin-bottom: 10px; }
    .score-badge { flex-shrink: 0; min-width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
    .score-badge.high { background: rgba(34,197,94,0.15); color: #16a34a; }
    .score-badge.mid { background: rgba(234,179,8,0.15); color: #b45309; }
    .score-badge.low { background: rgba(0,0,0,0.07); color: var(--muted); }
    .prospect-card h4, .detail-card h3, .automation-card h4, .event-card h4 { margin: 0; font-family: var(--font-heading); }

    .score-chip {
      min-width: 58px;
      height: 58px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 22px;
      font-weight: 700;
    }

    .detail-card {
      position: sticky;
      top: 18px;
      align-self: start;
      display: grid;
      gap: 14px;
      max-height: calc(100vh - 80px);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(113,75,103,0.2) transparent;
    }
    .detail-card::-webkit-scrollbar { width: 5px; }
    .detail-card::-webkit-scrollbar-thumb { background: rgba(113,75,103,0.2); border-radius: 999px; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .detail-item {
      padding: 12px;
      border-radius: 10px;
      background: #f9f8fb;
      border: 1px solid var(--line);
    }

    .detail-item strong { display: block; margin-bottom: 6px; }

    .link-button, .action-button {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      border-radius: 999px;
      border: 0;
      cursor: pointer;
      background: var(--accent);
      color: white;
    }

    .link-button.secondary, .action-button.secondary {
      background: rgba(255,255,255,0.9);
      color: var(--ink);
      border: 1px solid var(--line);
    }

    .action-button.warn { background: #9c6a1b; }
    .action-button.danger { background: #98364c; }
    .action-button:disabled { opacity: 0.45; cursor: progress; }

    .summary-box, .table-shell {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: #ffffff;
      overflow: hidden;
    }

    .summary-box { padding: 18px; }
    .summary-box ul { margin: 0 0 10px 18px; padding: 0; }

    .feedback-form {
      display: grid;
      gap: 10px;
      padding-top: 6px;
      border-top: 1px solid var(--line);
    }

    .feedback-form select, .feedback-form textarea, .feedback-form input[type="text"], .feedback-form input[type="email"], .feedback-form input[type="tel"], .feedback-form input[type="number"] {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #f9f8fb;
      padding: 10px 12px;
      color: var(--ink);
      box-sizing: border-box;
      transition: border-color 0.12s;
    }
    .feedback-form select:focus, .feedback-form textarea:focus, .feedback-form input:focus {
      outline: none;
      border-color: rgba(113, 75, 103, 0.5);
      background: #fff;
    }
    .field-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 6px; }

    .info-block {
      padding: 12px 14px;
      border-radius: 10px;
      background: #f9f8fb;
      border: 1px solid var(--line);
      border-left: 3px solid var(--accent);
    }
    .info-block .info-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      display: block;
      margin-bottom: 6px;
    }
    .info-block p { margin: 0; font-size: 13px; line-height: 1.55; color: var(--ink); }

    .links-section { display: grid; gap: 8px; }
    .links-section .field-label { margin-bottom: 4px; }
    .link-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: #ffffff;
      font-size: 12px;
      font-weight: 500;
      color: var(--ink);
      text-decoration: none;
      cursor: pointer;
      transition: border-color 0.12s, background 0.12s, color 0.12s;
    }
    .link-pill:hover { border-color: rgba(113, 75, 103, 0.4); background: var(--accent-soft); color: var(--accent); }

    .odoo-prefill { display: grid; gap: 12px; padding-bottom: 4px; }
    .odoo-prefill-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .odoo-prefill-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    @media (max-width: 900px) { .odoo-prefill-row-3 { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .odoo-prefill-row, .odoo-prefill-row-3 { grid-template-columns: 1fr; } }
    .odoo-section { display: grid; gap: 8px; }
    .odoo-section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.45; font-weight: 700; padding-bottom: 4px; border-bottom: 1px solid var(--line); margin-bottom: 2px; }
    .odoo-field-full { grid-column: 1 / -1; }

    .scoring-list { display: grid; gap: 8px; }
    .scoring-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 14px;
      color: var(--muted);
    }

    .notice {
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--accent-soft);
      color: var(--muted);
      font-size: 14px;
    }

    .notice.success {
      background: rgba(47, 125, 96, 0.12);
      color: #2f7d60;
    }

    .notice.error {
      background: rgba(161, 60, 82, 0.12);
      color: #a13c52;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1080px;
    }

    th, td {
      padding: 14px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }

    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      background: rgba(255,255,255,0.95);
      position: sticky;
      top: 0;
    }

    tr:last-child td { border-bottom: 0; }
    .automation-card, .event-card, .playbook-card { display: grid; gap: 12px; }
    .event-card, .playbook-card { background: rgba(255,255,255,0.86); }
    .veille-grid { display: grid; gap: 28px; }
    .veille-category-title { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
    .veille-sources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
    .veille-card { background: rgba(255,255,255,0.86); border-radius: 12px; padding: 18px 20px; display: grid; gap: 8px; border: 1px solid rgba(0,0,0,0.06); transition: box-shadow 0.15s; }
    .veille-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
    .veille-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .veille-card h4 { font-size: 15px; font-weight: 700; margin: 0; }
    .veille-card p { font-size: 13px; color: var(--muted); line-height: 1.5; margin: 0; }
    .veille-card a { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: var(--accent); text-decoration: none; margin-top: 4px; }
    .veille-card a:hover { text-decoration: underline; }
    .veille-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill-recommended { background: rgba(34,197,94,0.12); color: #16a34a; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
    .pill-type { background: rgba(143,62,105,0.08); color: var(--accent); font-size: 11px; padding: 2px 8px; border-radius: 999px; }
    .pill-cadence { background: rgba(0,0,0,0.06); color: var(--muted); font-size: 11px; padding: 2px 8px; border-radius: 999px; }
    .event-card .section-head, .playbook-card .section-head { margin-bottom: 0; }
    .event-date {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 11px;
      border-radius: 999px;
      background: rgba(113, 75, 103, 0.08);
      color: var(--accent);
      font-size: 12px;
      font-weight: 600;
    }
    .section-list {
      margin: 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.55;
    }
    .section-list li + li { margin-top: 6px; }
    .event-source {
      font-size: 13px;
      color: var(--muted);
    }
    .event-source a {
      color: var(--accent);
      text-decoration: none;
    }
    .event-source a:hover { text-decoration: underline; }
    .pill-event-salon { background: rgba(143,62,105,0.12); color: var(--accent); font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
    .pill-event-chambre { background: rgba(47,125,96,0.12); color: var(--good); font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
    .pill-event-networking { background: rgba(199,133,90,0.18); color: var(--accent-2); font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
    .pill-event-association { background: rgba(59,114,183,0.12); color: #3b72b7; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
    .events-groups { display: grid; gap: 32px; }
    .events-group-label { font-size: 11px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); padding-bottom: 10px; border-bottom: 1px solid var(--line); margin-bottom: 2px; }
    .events-group-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
    .pill-partner-comptable { background: rgba(59,114,183,0.12); color: #3b72b7; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
    .pill-partner-transformation { background: rgba(199,133,90,0.18); color: var(--accent-2); font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
    .pill-partner-financement { background: rgba(47,125,96,0.12); color: var(--good); font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
    .pill-partner-association { background: rgba(143,62,105,0.12); color: var(--accent); font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
    .partner-card { background: rgba(255,255,255,0.86); display: grid; gap: 12px; }
    .partner-card h4 { margin: 0; font-family: var(--font-heading); }
    .partner-step { background: rgba(143,62,105,0.06); border-left: 3px solid var(--accent); padding: 10px 14px; border-radius: 0 10px 10px 0; font-size: 13px; color: var(--ink); line-height: 1.5; }
    .partner-link { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: var(--accent); text-decoration: none; }
    .partner-link:hover { text-decoration: underline; }
    .partners-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
    .partners-groups { display: grid; gap: 32px; }
    .partners-group-label { font-size: 11px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); padding-bottom: 10px; border-bottom: 1px solid var(--line); margin-bottom: 2px; }
    .empty-state { padding: 24px; color: var(--muted); text-align: center; }

    /* ── Terrains de prospection — 4 sections ─────────────────────────── */
    .salon-filter-btns { display: inline-flex; gap: 3px; }
    .salon-filter-btn { border: 1px solid var(--line); border-radius: 999px; background: transparent; cursor: pointer; padding: 6px 14px; color: var(--muted); font-size: 12px; font-weight: 600; transition: all 0.15s; }
    .salon-filter-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
    .annual-strip { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; margin-bottom: 20px; }
    .annual-strip-month { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 4px; border-radius: 10px; border: 1px solid transparent; transition: background 0.12s; }
    .annual-strip-month.has-events { background: rgba(143,62,105,0.06); border-color: rgba(143,62,105,0.12); cursor: pointer; }
    .annual-strip-month.has-events:hover { background: rgba(143,62,105,0.13); }
    .annual-strip-month.is-current .strip-lbl { color: var(--accent); font-weight: 800; }
    .annual-strip-month.is-past { opacity: 0.4; }
    .strip-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); line-height: 1; }
    .strip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .strip-dot-high { background: var(--accent); }
    .strip-dot-medium { background: rgba(143,62,105,0.38); }
    .strip-dot-empty { background: var(--line); }
    .strip-count { font-size: 9px; font-weight: 700; color: var(--accent); min-height: 12px; }
    /* ── Events — format unifié ────────────────────────────────── */
    .events-filter-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; }
    .event-type-btn { border: 1px solid var(--line); border-radius: 999px; background: transparent; cursor: pointer; padding: 5px 12px; color: var(--muted); font-size: 11px; font-weight: 700; transition: all 0.15s; }
    .event-type-btn:hover { border-color: var(--accent); color: var(--accent); }
    .event-type-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
    .event-type-btn[data-events-type="upcoming"].active { background: var(--good); border-color: var(--good); }
    .event-type-btn[data-events-type="association"].active { background: #3b72b7; border-color: #3b72b7; }
    .event-type-btn[data-events-type="networking"].active { background: var(--accent-2); border-color: var(--accent-2); }
    .events-filter-sep { width: 1px; height: 16px; background: var(--line); margin: 0 3px; align-self: center; display: inline-block; }
    .events-list { display: grid; gap: 2px; }
    .events-group-sep { display: flex; align-items: center; gap: 10px; margin: 20px 0 8px; }
    .events-group-sep.first { margin-top: 0; }
    .events-group-sep-label { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
    .events-group-sep-line { flex: 1; height: 1px; background: var(--line); }
    .events-group-sep.type-salon .events-group-sep-label { color: var(--accent); }
    .events-group-sep.type-association .events-group-sep-label { color: #3b72b7; }
    .events-group-sep.type-chambre .events-group-sep-label { color: var(--good); }
    .events-group-sep.type-networking .events-group-sep-label { color: var(--accent-2); }
    .event-row { border-radius: 10px; overflow: hidden; margin-bottom: 2px; }
    .event-row > summary { display: grid; grid-template-columns: 22px 1fr 20px; gap: 10px; align-items: start; padding: 13px 16px; background: rgba(255,255,255,0.65); cursor: pointer; list-style: none; transition: background 0.12s; }
    .event-row > summary::-webkit-details-marker { display: none; }
    .event-row > summary:hover { background: rgba(255,255,255,0.92); }
    .event-row[open] > summary { background: rgba(255,255,255,0.96); border-radius: 10px 10px 0 0; border-bottom: 1px solid var(--line); }
    .event-row.is-past > summary { opacity: 0.42; }
    .event-row-priority { color: var(--accent); font-size: 15px; line-height: 1; padding-top: 3px; }
    .event-row-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .event-row-name { font-size: 14px; font-weight: 600; color: var(--ink); }
    .event-row-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .event-row-date { font-size: 12px; color: var(--muted); }
    .event-row-vertical { font-size: 11px; color: var(--muted); padding: 1px 7px; background: var(--accent-soft); border-radius: 999px; }
    .event-row-icp-preview { font-size: 11.5px; color: var(--muted); line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .event-row-arrow { font-size: 12px; color: var(--muted); transition: transform 0.2s; text-align: center; padding-top: 3px; }
    .event-row[open] .event-row-arrow { transform: rotate(180deg); }
    .event-row-body { background: rgba(255,255,255,0.96); border-radius: 0 0 10px 10px; padding: 14px 16px 16px; display: grid; gap: 10px; }
    .event-icp { font-size: 12px; color: var(--ink); line-height: 1.5; padding: 8px 12px; background: rgba(143,62,105,0.06); border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0; margin: 0; }
    .event-details-grid { display: grid; gap: 8px; }
    .edf { display: grid; grid-template-columns: 76px 1fr; gap: 8px; align-items: start; }
    .edf-label { font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; padding-top: 1px; }
    .edf-value { font-size: 12px; color: var(--ink); line-height: 1.45; }
    .edf-action { color: var(--accent); font-weight: 600; }
    .event-targets { display: flex; flex-wrap: wrap; gap: 4px; }
    .event-target-tag { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); }
    .event-source-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--accent); text-decoration: none; }
    .event-source-link:hover { text-decoration: underline; }
    /* placeholder to avoid missing old class refs */
    .assoc-row-vertical { font-size: 11px; color: var(--muted); text-align: right; }
    /* old card styles removed — replaced by unified event-row */
    .networking-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--accent); text-decoration: none; }
    .networking-link:hover { text-decoration: underline; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.95em; background: rgba(113, 75, 103, 0.08); padding: 2px 6px; border-radius: 8px; }

    @media (max-width: 1100px) {
      .overview-grid, .prospect-layout { grid-template-columns: 1fr; }
      .detail-card { position: static; }
      .top-header { border-radius: 22px 22px 0 0; flex-wrap: wrap; min-height: auto; padding: 12px 16px; gap: 10px; }
      .tab-nav { flex-wrap: wrap; }
    }

    @media (max-width: 760px) {
      .app-shell { width: min(100vw - 18px, 100%); margin: 9px auto 20px; }
      .panel { padding: 16px; border-radius: 22px; }
      .top-header { position: static; border-radius: 22px 22px 0 0; }
      .stats-strip { border-radius: 0 0 22px 22px; }
      .hero-head { display: grid; }
      .hero-meta { text-align: left; min-width: 0; }
      .detail-grid { grid-template-columns: 1fr; }
      table { min-width: 820px; }
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <header class="top-header">
      <div class="brand-inline">
        <div class="brand-mark">O</div>
        <div>
          <small>Private panel</small>
          <h1>Odoo Admin</h1>
        </div>
      </div>
      <nav class="tab-nav" id="tabNav"></nav>
      <div class="header-actions">
        <button type="button" class="refresh-btn" id="refreshBtn">↻ Actualiser</button>
      </div>
    </header>

    <div class="stats-strip">
      <div id="heroMetaInfo" style="display:contents"></div>
      <div class="stat-divider"></div>
      <div class="stat-item" style="flex:1;min-width:180px">
        <div class="stat-label">Apprentissages</div>
        <div id="learningList" class="learning-list"></div>
      </div>
    </div>

    <main class="main">

      <section id="prospectsPanel" class="tab-panel active">
        <div class="panel">
          <div class="section-head">
            <div>
              <h3>Prospects</h3>
              <p class="section-subtext">Tri recalculé selon tes règles, avec décisions de qualification persistantes sur chaque fiche.</p>
            </div>
            <div class="segmented">
              <button type="button" class="active" data-prospect-view="cards">Cartes</button>
              <button type="button" data-prospect-view="table">Table</button>
            </div>
          </div>
          <div class="toolbar">
            <div class="toolbar-group grow">
              <label for="searchMirror">Recherche rapide</label>
              <input id="searchMirror" type="search" placeholder="Nom, dirigeant, ville, mot-clé..." />
            </div>
            <div class="toolbar-group">
              <label for="industryFilter">Industrie</label>
              <select id="industryFilter"></select>
            </div>
            <div class="toolbar-group">
              <label for="scoreFilter">Score min</label>
              <select id="scoreFilter">
                <option value="0">Tous</option>
                <option value="7">7 / 10 +</option>
                <option value="8">8 / 10 +</option>
                <option value="9">9 / 10 +</option>
              </select>
            </div>
            <div class="toolbar-group">
              <label for="statusFilter">Statut</label>
              <select id="statusFilter">
                <option value="">Tous</option>
                <option value="chaud">Chaud</option>
                <option value="a_travailler">À travailler</option>
                <option value="file_attente">File d'attente</option>
                <option value="ecarte">Écarté</option>
              </select>
            </div>
          </div>

          <div class="prospect-layout">
            <div>
              <div id="prospectCardsView" class="prospect-list"></div>
              <div id="prospectTableView" class="table-shell" hidden></div>
            </div>
            <div class="panel detail-card" id="prospectDetail"></div>
          </div>
        </div>

        <div class="summary-box" id="batchSummary"></div>
      </section>

      <section id="veillePanel" class="tab-panel">
        <div class="panel">
          <div class="section-head">
            <div>
              <h3>Veille Odoo</h3>
              <p class="section-subtext">Sources fiables pour apprendre chaque jour — nouveautés, documentation, communauté et veille marché.</p>
            </div>
          </div>
          <div class="veille-grid" id="veilleGrid"></div>
        </div>
      </section>

      <section id="playbooksPanel" class="tab-panel">
        <div class="panel">
          <div class="section-head">
            <div>
              <h3>Playbooks</h3>
              <p class="section-subtext">Angles commerciaux, pains réels et modules Odoo à pousser selon les verticales qui t'intéressent maintenant.</p>
            </div>
          </div>
          <div class="playbook-grid" id="playbooksGrid"></div>
        </div>
      </section>

      <section id="eventsPanel" class="tab-panel">
        <div class="panel">
          <div class="section-head">
            <h3>Terrains de prospection</h3>
          </div>
          <div class="events-filter-row">
            <button type="button" class="event-type-btn active" data-events-type="all">Tous</button>
            <button type="button" class="event-type-btn" data-events-type="upcoming">À venir</button>
            <span class="events-filter-sep"></span>
            <button type="button" class="event-type-btn" data-events-type="salon">Salons</button>
            <button type="button" class="event-type-btn" data-events-type="association">Associations</button>
            <button type="button" class="event-type-btn" data-events-type="chambre">Chambres</button>
            <button type="button" class="event-type-btn" data-events-type="networking">Networking</button>
          </div>
          <div id="salonsCalendarStrip"></div>
          <div id="eventsList"></div>
        </div>
      </section>

      <section id="partnersPanel" class="tab-panel">
        <div class="panel">
          <div class="section-head">
            <div>
              <h3>Partenaires référencement</h3>
              <p class="section-subtext">Cabinets comptables, conseillers en financement, firmes de transformation et associations sectorielles qui côtoient déjà notre ICP — et peuvent nous référer des clients qualifiés.</p>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="section-head" style="flex-wrap:wrap;gap:12px;align-items:flex-start;">
            <div>
              <h3>Fiches partenaires</h3>
              <p class="section-subtext">Pour chaque partenaire : pourquoi ils sont pertinents, comment les approcher et quelle est la première action concrète.</p>
            </div>
            <select id="partnerTypeFilter" class="filter-select">
              <option value="">Tous les types</option>
              <option value="comptable">Cabinets comptables</option>
              <option value="financement">Financement / gouvernement</option>
              <option value="transformation">Conseil en transformation</option>
              <option value="association">Associations sectorielles</option>
            </select>
          </div>
          <div id="partnersGrid"></div>
        </div>
      </section>
    </main>
  </div>

  <script>
    const initialData = ${initialData};
    const renderSummaryMarkup = ${snapshot.renderSummaryMarkup};
    const state = {
      tab: "prospects",
      search: "",
      sector: "",
      status: "",
      minScore: 0,
      prospectView: "cards",
      selectedProspectId: initialData.prospects[0]?.id || "",
      saving: false,
      feedbackNotice: "",
      eventsTypeFilter: "all",
      partnerTypeFilter: ""
    };

    let data = initialData;

    const tabNavEl = document.getElementById("tabNav");
    const heroMetaEl = document.getElementById("heroMetaInfo");
    const refreshBtnEl = document.getElementById("refreshBtn");
    const learningListEl = document.getElementById("learningList");
    const searchMirrorEl = document.getElementById("searchMirror");
    const industryFilterEl = document.getElementById("industryFilter");
    const scoreFilterEl = document.getElementById("scoreFilter");
    const statusFilterEl = document.getElementById("statusFilter");
    const prospectCardsViewEl = document.getElementById("prospectCardsView");
    const prospectTableViewEl = document.getElementById("prospectTableView");
    const prospectDetailEl = document.getElementById("prospectDetail");
    const batchSummaryEl = document.getElementById("batchSummary");
    const veilleGridEl = document.getElementById("veilleGrid");
    const playbooksGridEl = document.getElementById("playbooksGrid");
    const salonsCalendarStripEl = document.getElementById("salonsCalendarStrip");
    const eventsListEl = document.getElementById("eventsList");
    const partnersGridEl = document.getElementById("partnersGrid");
    const partnerTypeFilterEl = document.getElementById("partnerTypeFilter");
    const prospectViewButtons = Array.from(document.querySelectorAll("[data-prospect-view]"));
    const tabPanels = {
      prospects: document.getElementById("prospectsPanel"),
      veille: document.getElementById("veillePanel"),
      playbooks: document.getElementById("playbooksPanel"),
      events: document.getElementById("eventsPanel"),
      partners: document.getElementById("partnersPanel")
    };

    const reasonLabels = {
      "": "Aucune raison",
      too_tech: "Trop tech / peut internaliser",
      accounting: "Compta / CPA peu prioritaire",
      generic_services: "Services génériques",
      low_fit: "Qualification faible",
      duplicate: "Doublon / déjà vu",
      not_now: "Pas maintenant",
      qualified: "Qualification confirmée"
    };

    function setFeedbackNotice(kind, message) {
      state.feedbackNotice = message ? JSON.stringify({ kind, message }) : "";
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function formatCad(value) {
      return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
    }

    function percentage(value) {
      return value + "%";
    }

    function safeLink(url, label) {
      if (!url) return "";
      return '<a class="link-pill" href="' + String(url).replace(/"/g, "&quot;") + '" target="_blank" rel="noreferrer">' + label + '</a>';
    }

    function fileLink(filePath, label) {
      if (window.location.hostname && !["127.0.0.1", "localhost"].includes(window.location.hostname)) return "";
      if (!filePath) return "";
      return '<a class="link-pill" href="file://' + String(filePath).replace(/"/g, "&quot;") + '">' + label + '</a>';
    }

    async function refreshData() {
      if (!window.location.protocol.startsWith("http")) return;
      const response = await fetch("/api/dashboard-data");
      data = await response.json();
    }

    function filteredProspects() {
      const query = state.search.trim().toLowerCase();
      const showExcluded = state.status === "ecarte" || state.status === "bad_fit";
      return data.prospects.filter((prospect) => {
        if (!showExcluded && prospect.excluded) return false;
        if (state.sector && prospect.sectorGroup !== state.sector) return false;
        if (state.status && prospect.status !== state.status) return false;
        if (state.minScore > 0 && (prospect.scoreValue || 0) < state.minScore) return false;
        if (!query) return true;
        const haystack = [prospect.name, prospect.sector, prospect.sectorGroup, prospect.owner, prospect.email, prospect.phone, prospect.angle, prospect.signal, prospect.address].join(" ").toLowerCase();
        return haystack.includes(query);
      });
    }

    function renderTabNav() {
      const items = [
        ["prospects", "Prospects", "Liste détaillée et fiches"],
        ["veille", "Veille Odoo", "Sources fiables pour se tenir à jour"],
        ["playbooks", "Playbooks", "Angles, pains et modules par verticale"],
        ["events", "Événements", "Salons et terrain à prospecter"],
        ["partners", "Partenaires", "Cabinets et réseaux de référencement"]
      ];

      tabNavEl.innerHTML = items.map(([id, title, text]) => \`
        <button type="button" class="tab-button \${state.tab === id ? "active" : ""}" data-tab="\${id}">
          <strong>\${title}</strong>
          <span>\${text}</span>
        </button>
      \`).join("");

      Array.from(tabNavEl.querySelectorAll("[data-tab]")).forEach((button) => {
        button.addEventListener("click", () => {
          state.tab = button.dataset.tab;
          render();
        });
      });
    }

    function renderHero() {
      const generated = new Date(data.generatedAt);
      const icpSectors = new Set(["Manufacturier / industrie","Distribution industrielle","Distribution alimentaire","CVAC / mécanique bâtiment","Réfrigération / froid","Protection incendie / sécurité","Sécurité / alarmes","Génie-conseil / ingénierie","Architecture","Construction / entrepreneur","Services techniques / maintenance"]);
      const active = data.prospects.filter((p) => !p.excluded);
      const chauds = active.filter((p) => (p.scoreValue || 0) >= 8).length;
      const aTravailler = active.filter((p) => p.status === "a_travailler").length;
      const icpTotal = active.filter((p) => icpSectors.has(p.sectorGroup)).length;
      const ecartes = data.prospects.filter((p) => p.excluded).length;
      const time = generated.toLocaleTimeString("fr-CA", {hour:"2-digit",minute:"2-digit"});
      heroMetaEl.innerHTML =
        '<div class="stat-item"><div class="stat-label">Leads chauds</div><div class="stat-value" style="color:#c7455e">' + chauds + '</div><div class="stat-sub">score 8+</div></div>'
        + '<div class="stat-divider"></div>'
        + '<div class="stat-item"><div class="stat-label">À travailler</div><div class="stat-value">' + aTravailler + '</div><div class="stat-sub">score 7–8</div></div>'
        + '<div class="stat-divider"></div>'
        + '<div class="stat-item"><div class="stat-label">ICP qualifiés</div><div class="stat-value">' + icpTotal + '</div><div class="stat-sub">actifs</div></div>'
        + '<div class="stat-divider"></div>'
        + '<div class="stat-item"><div class="stat-label">Écartés</div><div class="stat-value" style="color:#aaa">' + ecartes + '</div><div class="stat-sub">cachés</div></div>'
        + '<div class="stat-divider"></div>'
        + '<div class="stat-item"><div class="stat-label">Mis à jour</div><div class="stat-value" style="font-size:16px;font-weight:600">' + time + '</div></div>';
    }

    function renderLearning() {
      const sectors = (data.learning?.rejectedSectors || []).slice(0, 3);
      const approved = (data.learning?.approvedSectors || []).slice(0, 2);
      const reasons = (data.learning?.rejectedReasons || []).slice(0, 3);
      const weekly = data.learning?.recentActions || null;
      const monthly = data.monthlyState || null;
      const lines = [];

      if (weekly && weekly.total > 0) {
        lines.push('<div class="learning-item"><strong>' + weekly.total + " actions / " + weekly.lookbackDays + 'j</strong> • ' + weekly.approved + " validés • " + weekly.review + " à revoir • " + weekly.rejected + " écartés</div>");
      }

      if (monthly) {
        const runDate = new Date(monthly.lastRun).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
        lines.push('<div class="learning-item" style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;margin-top:4px;"><strong>Consolidation ' + monthly.month + '</strong></div>');
        if (monthly.decisionsAnalyzed > 0) {
          lines.push('<div class="learning-item">' + monthly.decisionsAnalyzed + " décisions analysées • " + monthly.approvedTotal + "✓ " + monthly.rejectedTotal + "✗</div>");
        }
        if (monthly.rulesUpdated?.length > 0) {
          monthly.rulesUpdated.forEach((r) => {
            const sign = r.change > 0 ? "+" : "";
            const arrow = r.direction === "boosted" ? "↑" : "↓";
            lines.push('<div class="learning-item">' + arrow + " " + escapeHtml(r.label) + " " + sign + r.change.toFixed(2) + "</div>");
          });
        } else {
          lines.push('<div class="learning-item">Règles stables — pas assez de signal</div>');
        }
        if (monthly.archivedCount > 0) {
          lines.push('<div class="learning-item">' + monthly.archivedCount + " prospects archivés</div>");
        }
      }

      sectors.forEach((item) => {
        lines.push('<div class="learning-item"><strong>' + escapeHtml(item.sector) + "</strong> rejeté " + item.count + "x</div>");
      });

      reasons.forEach((item) => {
        lines.push('<div class="learning-item">' + escapeHtml(reasonLabels[item.reason] || item.reason) + " • " + item.count + "x</div>");
      });

      approved.forEach((item) => {
        lines.push('<div class="learning-item"><strong>✓ confirmé</strong> ' + escapeHtml(item.sector) + " • " + item.count + "x</div>");
      });

      learningListEl.innerHTML = lines.length
        ? lines.join("")
        : "<div class='learning-item'>Aucune décision enregistrée pour l'instant.</div>";
    }

    function selectedProspect(prospects) {
      return prospects.find((item) => item.id === state.selectedProspectId) || prospects[0] || data.prospects[0] || null;
    }

    function renderProspects() {
      const prospects = filteredProspects();
      const selected = selectedProspect(prospects);
      if (selected) state.selectedProspectId = selected.id;

      prospectCardsViewEl.innerHTML = prospects.length ? prospects.map((prospect) => {
        return \`
        <article class="prospect-card \${selected && selected.id === prospect.id ? "active" : ""} \${prospect.excluded ? "is-excluded" : ""}" data-prospect-id="\${prospect.id}">
          <header>
            <div>
              <h4>\${prospect.name}</h4>
              <div class="section-subtext">\${prospect.size || prospect.sectorGroup || ""}</div>
            </div>
          </header>
          <div class="pill-row">
            \${prospect.sectorGroup ? \`<span class="pill">\${prospect.sectorGroup}</span>\` : ""}
            \${prospect.status === "odoo_done" ? '<span class="pill" style="background:rgba(34,197,94,0.12);color:#16a34a">→ CRM</span>' : ""}
          </div>
          <p class="section-subtext">\${prospect.angle || prospect.signal || "Signal à préciser."}</p>
        </article>
      \`;
      }).join("") : '<div class="empty-state">Aucun prospect ne correspond aux filtres.</div>';

      Array.from(prospectCardsViewEl.querySelectorAll("[data-prospect-id]")).forEach((card) => {
        card.addEventListener("click", () => {
          state.selectedProspectId = card.dataset.prospectId;
          renderProspects();
        });
      });

      prospectTableViewEl.innerHTML = prospects.length ? \`
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Entreprise</th>
              <th>Secteur</th>
              <th>Statut</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            \${prospects.map((prospect, idx) => \`
              <tr data-prospect-row="\${prospect.id}">
                <td class="section-subtext">\${idx + 1}</td>
                <td><strong>\${prospect.name}</strong><br><span class="section-subtext">\${prospect.size || ""}</span></td>
                <td>\${prospect.sector || ""}</td>
                <td>—</td>
                <td>\${prospect.owner || "À trouver"}<br><span class="section-subtext">\${prospect.email || prospect.phone || "Aucun direct"}</span></td>
              </tr>
            \`).join("")}
          </tbody>
        </table>
      \` : '<div class="empty-state">Aucun prospect ne correspond aux filtres.</div>';

      Array.from(prospectTableViewEl.querySelectorAll("[data-prospect-row]")).forEach((row) => {
        row.addEventListener("click", () => {
          state.selectedProspectId = row.dataset.prospectRow;
          renderProspects();
        });
      });

      prospectDetailEl.innerHTML = selected ? buildProspectDetail(selected) : '<div class="empty-state">Sélectionne un prospect pour voir le détail.</div>';

      if (selected) {
        bindFeedbackForm(selected.id);
      }

      batchSummaryEl.innerHTML = (data.sourcingContext || []).length
        ? "<h3>Cadre de tri</h3><ul>" + data.sourcingContext.map((line) => "<li>" + escapeHtml(line) + "</li>").join("") + "</ul>"
        : '<div class="empty-state">Aucun contexte de tri disponible.</div>';

      prospectViewButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.prospectView === state.prospectView);
      });
      prospectCardsViewEl.hidden = state.prospectView !== "cards";
      prospectTableViewEl.hidden = state.prospectView !== "table";
    }

    function buildProspectDetail(selected) {
      const contributions = selected.scoring.contributions || [];
      const contributionHtml = contributions.length
        ? contributions.map((item) => '<div class="scoring-item"><span>' + escapeHtml(item.label) + '</span><strong>' + (item.delta > 0 ? "+" : "") + item.delta.toFixed(2) + "</strong></div>").join("")
        : "<div class='notice'>Aucune règle sectorielle spécifique n'a modifié ce score.</div>";

      const learnedPenaltyHtml = selected.scoring.learnedPenalty > 0
        ? '<div class="scoring-item"><span>Apprentissage par rejets secteur</span><strong>-' + selected.scoring.learnedPenalty.toFixed(2) + "</strong></div>"
        : "";
      const learnedBoostHtml = selected.scoring.learnedBoost > 0
        ? '<div class="scoring-item"><span>Apprentissage par qualifications confirmées</span><strong>+' + selected.scoring.learnedBoost.toFixed(2) + "</strong></div>"
        : "";
      const learnedRuleHtml = selected.scoring.learnedRuleAdjustment !== 0
        ? '<div class="scoring-item"><span>Ajustement appris sur type de lead</span><strong>' + (selected.scoring.learnedRuleAdjustment > 0 ? "+" : "") + selected.scoring.learnedRuleAdjustment.toFixed(2) + "</strong></div>"
        : "";

      const readOnly = !window.location.protocol.startsWith("http");
      const readOnlyNotice = readOnly
        ? '<div class="notice">Mode lecture seule. Pour qualifier, écarter ou annoter un prospect, ouvre le panel via le serveur local.</div>'
        : "";
      const feedbackNotice = state.feedbackNotice
        ? (() => {
            const parsed = JSON.parse(state.feedbackNotice);
            return '<div class="notice ' + parsed.kind + '">' + escapeHtml(parsed.message) + '</div>';
          })()
        : "";

      const isBlacklisted = selected.status === "odoo_done" || selected.status === "bad_fit";
      const isToRecontact = selected.status === "a_recontacter";

      // Parse address for form pre-fill
      const addrRaw = selected.address || "";
      const addrZipM = addrRaw.match(/([A-Z]\d[A-Z]\s*\d[A-Z]\d)/);
      const addrZip = addrZipM ? addrZipM[1].replace(/\s/, " ") : "";
      const addrBase = addrRaw.replace(addrZip, "").trim().replace(/,\s*$/, "");
      const addrParts = addrBase.split(",").map(s => s.trim()).filter(Boolean);
      const addrLast = addrParts[addrParts.length - 1] || "";
      const addrIsProv = /^[A-Z]{2}$/.test(addrLast);
      const addrCity = addrIsProv ? (addrParts[addrParts.length - 2] || "") : addrLast;
      const addrStreet = (addrIsProv ? addrParts.slice(0, -2) : addrParts.slice(0, -1)).join(", ");

      return \`
        <div class="section-head">
          <div>
            <h3>\${selected.name}</h3>
            <p class="section-subtext">\${selected.sector || "Secteur à confirmer"}</p>
          </div>
        </div>
        <div class="pill-row">
          \${selected.size ? \`<span class="pill">\${selected.size}</span>\` : ""}
          \${isBlacklisted ? '<span class="pill danger">Blacklisté</span>' : ""}
        </div>
        <div class="detail-grid">
          <div class="detail-item"><strong>Décisionnaire</strong>\${selected.owner || "À trouver"}</div>
          <div class="detail-item"><strong>Email</strong>\${selected.email || "À trouver"}</div>
          <div class="detail-item"><strong>Téléphone</strong>\${selected.phone || "À trouver"}</div>
          <div class="detail-item"><strong>Adresse</strong>\${selected.address || "Non renseignée"}</div>
        </div>
        <div class="info-block">
          <span class="info-label">Angle d'attaque</span>
          <p>\${selected.angle || "Aucun angle documenté."}</p>
        </div>
        <div class="info-block" style="border-left-color: var(--accent-2);">
          <span class="info-label" style="color: var(--accent-2);">Signal timing</span>
          <p>\${selected.signal || "À creuser."}</p>
        </div>
        \${(selected.resourceLinks?.direct?.length || selected.fichePath) ? \`
        <div class="links-section">
          <span class="field-label">Accès rapides</span>
          <div class="pill-row">\${(selected.resourceLinks?.direct || []).map((link) => safeLink(link.url, link.label)).join("")}\${fileLink(selected.fichePath, "Fiche locale")}</div>
        </div>\` : ""}
        \${selected.resourceLinks?.searches?.length ? \`
        <div class="links-section">
          <span class="field-label">Recherche décisionnaire</span>
          <div class="pill-row">\${(selected.resourceLinks.searches || []).map((link) => safeLink(link.url, link.label)).join("")}</div>
        </div>\` : ""}
        \${readOnlyNotice}
        \${feedbackNotice}
        \${isBlacklisted ? '<div class="notice">Ce lead est blacklisté définitivement.</div>' : \`
        <form class="feedback-form" id="feedbackForm">
          <div class="odoo-prefill">

            <div class="odoo-section">
              <div class="odoo-section-title">Entreprise</div>
              <div class="odoo-prefill-row">
                <div class="odoo-field-full">
                  <label class="field-label" for="odooCompany">Nom de l'entreprise</label>
                  <input id="odooCompany" type="text" value="\${escapeHtml(selected.name || '')}" placeholder="Nom de l'entreprise" \${readOnly ? "disabled" : ""}>
                </div>
              </div>
              <div class="odoo-prefill-row">
                <div>
                  <label class="field-label" for="odooTag">Étiquette industrie</label>
                  <input id="odooTag" type="text" value="\${escapeHtml(selected.sector || '')}" placeholder="ex: Distribution alimentaire" \${readOnly ? "disabled" : ""}>
                </div>
                <div>
                  <label class="field-label" for="odooRevenue">Revenu prévu (CAD)</label>
                  <input id="odooRevenue" type="number" value="" placeholder="ex: 7500" min="0" step="500" \${readOnly ? "disabled" : ""}>
                </div>
              </div>
            </div>

            <div class="odoo-section">
              <div class="odoo-section-title">Adresse</div>
              <div class="odoo-prefill-row">
                <div class="odoo-field-full">
                  <label class="field-label" for="odooStreet">Rue</label>
                  <input id="odooStreet" type="text" value="\${escapeHtml(addrStreet)}" placeholder="755 Autoroute Chomedey Ouest" \${readOnly ? "disabled" : ""}>
                </div>
              </div>
              <div class="odoo-prefill-row">
                <div>
                  <label class="field-label" for="odooCity">Ville</label>
                  <input id="odooCity" type="text" value="\${escapeHtml(addrCity)}" placeholder="Laval" \${readOnly ? "disabled" : ""}>
                </div>
                <div>
                  <label class="field-label" for="odooZip">Code postal</label>
                  <input id="odooZip" type="text" value="\${escapeHtml(addrZip)}" placeholder="H7W 5N4" \${readOnly ? "disabled" : ""}>
                </div>
              </div>
            </div>

            <div class="odoo-section">
              <div class="odoo-section-title">Contact</div>
              <div class="odoo-prefill-row-3">
                <div>
                  <label class="field-label" for="odooContact">Décisionnaire</label>
                  <input id="odooContact" type="text" value="\${escapeHtml(selected.owner || '')}" placeholder="Nom du décisionnaire" \${readOnly ? "disabled" : ""}>
                </div>
                <div>
                  <label class="field-label" for="odooEmail">Email</label>
                  <input id="odooEmail" type="email" value="\${escapeHtml(selected.email || '')}" placeholder="email@entreprise.com" \${readOnly ? "disabled" : ""}>
                </div>
                <div>
                  <label class="field-label" for="odooPhone">Téléphone</label>
                  <input id="odooPhone" type="tel" value="\${escapeHtml(selected.phone || '')}" placeholder="514-xxx-xxxx" \${readOnly ? "disabled" : ""}>
                </div>
              </div>
              <div class="odoo-prefill-row">
                <div>
                  <label class="field-label" for="odooWebsite">Site web</label>
                  <input id="odooWebsite" type="text" value="\${escapeHtml(selected.website || '')}" placeholder="https://..." \${readOnly ? "disabled" : ""}>
                </div>
                <div>
                  <label class="field-label" for="odooLinkedin">LinkedIn décisionnaire</label>
                  <input id="odooLinkedin" type="text" value="\${escapeHtml(selected.linkedin || '')}" placeholder="https://linkedin.com/in/..." \${readOnly ? "disabled" : ""}>
                </div>
              </div>
            </div>

            <div class="odoo-section">
              <div class="odoo-section-title">Note interne</div>
              <textarea id="noteInput" rows="3" placeholder="Contexte, remarque, ce que tu as trouvé..." \${readOnly ? "disabled" : ""}>\${escapeHtml(selected.override.note || "")}</textarea>
            </div>

          </div>
          \${(!selected.owner && !selected.email) ? '<div class="notice warn" style="font-size:12px;padding:8px 12px">Contact et email non trouvés — à remplir manuellement pour un lead complet dans Odoo.</div>' : (!selected.owner ? '<div class="notice warn" style="font-size:12px;padding:8px 12px">Nom du décisionnaire manquant — à remplir si disponible.</div>' : (!selected.email ? '<div class="notice warn" style="font-size:12px;padding:8px 12px">Email manquant — le lead sera créé sans email de contact.</div>' : ""))}
          <div class="action-row">
            <button type="button" class="action-button" data-decision="odoo_done" \${readOnly || state.saving ? "disabled" : ""}>→ Odoo</button>
            <button type="button" class="action-button danger" data-decision="bad_fit" \${readOnly || state.saving ? "disabled" : ""}>Pas bon</button>
          </div>
        </form>
        \`}
      \`;
    }

    function bindFeedbackForm(prospectId) {
      Array.from(prospectDetailEl.querySelectorAll("[data-decision]")).forEach((button) => {
        button.addEventListener("click", async () => {
          if (!window.location.protocol.startsWith("http")) return;
          const noteEl = document.getElementById("noteInput");
          const note = noteEl ? noteEl.value : "";
          const isOdooPush = button.dataset.decision === "odoo_done";
          state.saving = true;
          setFeedbackNotice("", isOdooPush ? "Envoi vers Odoo CRM..." : "");
          renderProspects();
          Array.from(prospectDetailEl.querySelectorAll("[data-decision]")).forEach((action) => {
            action.disabled = true;
          });
          try {
            if (isOdooPush) {
              const company = document.getElementById("odooCompany")?.value || "";
              const contact = document.getElementById("odooContact")?.value || "";
              const email = document.getElementById("odooEmail")?.value || "";
              const phone = document.getElementById("odooPhone")?.value || "";
              const website = document.getElementById("odooWebsite")?.value || "";
              const linkedin = document.getElementById("odooLinkedin")?.value || "";
              const tag = document.getElementById("odooTag")?.value || "";
              const revenue = document.getElementById("odooRevenue")?.value || "";
              const street = document.getElementById("odooStreet")?.value || "";
              const city = document.getElementById("odooCity")?.value || "";
              const zip = document.getElementById("odooZip")?.value || "";
              const odooResp = await fetch("/api/push-to-odoo?id=" + encodeURIComponent(prospectId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note, company, contact, email, phone, website, linkedin, tag, revenue, street, city, zip })
              });
              const odooPayload = await odooResp.json();
              if (!odooResp.ok) {
                throw new Error(odooPayload.detail || "Erreur envoi Odoo");
              }
            }
            const response = await fetch("/api/prospect-feedback?id=" + encodeURIComponent(prospectId), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                decision: button.dataset.decision,
                note
              })
            });
            const payload = await response.json();
            if (!response.ok) {
              throw new Error(payload.detail || "Erreur de sauvegarde");
            }
            data = payload;
            setFeedbackNotice("success", isOdooPush ? "Lead créé dans Odoo CRM ✓" : "Décision enregistrée.");
          } catch (error) {
            setFeedbackNotice("error", error instanceof Error ? error.message : "Erreur de sauvegarde");
          } finally {
            state.saving = false;
            render();
          }
        });
      });
    }

    function renderVeille() {
      const categories = data.veille || [];
      if (!categories.length) {
        veilleGridEl.innerHTML = '<div class="notice">Aucune source configurée.</div>';
        return;
      }
      veilleGridEl.innerHTML = categories.map((cat) => \`
        <div>
          <div class="veille-category-title">\${escapeHtml(cat.category)}</div>
          <div class="veille-sources-grid">
            \${(cat.sources || []).map((source) => \`
              <div class="veille-card">
                <div class="veille-card-header">
                  <h4>\${escapeHtml(source.title)}</h4>
                </div>
                <p>\${escapeHtml(source.description)}</p>
                <div class="veille-meta">
                  \${source.recommended ? '<span class="pill-recommended">Recommandé</span>' : ''}
                  <span class="pill-type">\${escapeHtml(source.type)}</span>
                  <span class="pill-cadence">\${escapeHtml(source.cadence)}</span>
                  \${source.language ? '<span class="pill-cadence">' + escapeHtml(source.language) + '</span>' : ''}
                </div>
                <a href="\${escapeHtml(source.url)}" target="_blank" rel="noopener">Ouvrir →</a>
              </div>
            \`).join("")}
          </div>
        </div>
      \`).join("");
    }

    function renderList(items) {
      if (!items || !items.length) {
        return "<div class='notice'>Rien de documenté pour l'instant.</div>";
      }

      return '<ul class="section-list">' + items.map((item) => '<li>' + escapeHtml(item) + "</li>").join("") + "</ul>";
    }

    function renderPlaybooks() {
      playbooksGridEl.innerHTML = (data.playbooks || []).map((playbook) => \`
        <article class="panel playbook-card">
          <div class="section-head">
            <div>
              <h4>\${playbook.industry}</h4>
              <p class="section-subtext">\${playbook.icp}</p>
            </div>
            <span class="pill">\${playbook.fit}</span>
          </div>
          <div class="pill-row">
            <span class="pill">Priorité \${playbook.priority}</span>
            <span class="pill">\${playbook.offerHypothesis}</span>
          </div>
          <div><strong class="field-label">Angles à prendre</strong>\${renderList(playbook.angles)}</div>
          <div><strong class="field-label">Gros problèmes rencontrés</strong>\${renderList(playbook.problems)}</div>
          <div><strong class="field-label">Modules Odoo à pousser</strong>\${renderList(playbook.modules)}</div>
          <div><strong class="field-label">Questions de discovery</strong>\${renderList(playbook.questions)}</div>
          <div><strong class="field-label">Red flags</strong>\${renderList(playbook.redFlags)}</div>
        </article>
      \`).join("");
    }

    const MONTHS_FR_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jui","Aoû","Sep","Oct","Nov","Déc"];
    const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

    function getEventStartDate(event) {
      if (!event.dateStart || (event.window || "").startsWith("Récurrent") || (event.dateLabel || "").includes("Récurrent")) return null;
      const d = new Date(event.dateStart + "T12:00:00");
      return isNaN(d.getTime()) ? null : d;
    }

    function _unused_renderCalendar() {
      const now = new Date();
      const events = (data.events || []);
      const typeFilter = state.eventTypeFilter;
      const filtered = typeFilter ? events.filter((e) => (e.type || "salon") === typeFilter) : events;

      const recurring = filtered.filter(isRecurringEvent);
      const dated = filtered.filter((e) => !isRecurringEvent(e));

      // Plage de mois à afficher
      const allDates = dated.map(getEventStartDate).filter(Boolean);
      const minDate = allDates.length ? allDates.reduce((a, b) => a < b ? a : b) : new Date(now.getFullYear(), now.getMonth(), 1);
      const maxDate = allDates.length ? allDates.reduce((a, b) => a > b ? a : b) : new Date(now.getFullYear() + 1, 11, 1);

      // Toujours partir du mois courant - 1
      const startYear = Math.min(minDate.getFullYear(), now.getFullYear());
      const startMonth = startYear === now.getFullYear() ? Math.min(minDate.getMonth(), now.getMonth()) : minDate.getMonth();

      const months = [];
      const cursor = new Date(startYear, startMonth, 1);
      const endCursor = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);
      while (cursor <= endCursor) {
        months.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      // Grouper par mois
      const byMonth = {};
      dated.forEach((e) => {
        const d = getEventStartDate(e);
        if (!d) return;
        const key = \`\${d.getFullYear()}-\${d.getMonth()}\`;
        if (!byMonth[key]) byMonth[key] = [];
        byMonth[key].push(e);
      });

      function chipHtml(event) {
        const t = event.type || "salon";
        const d = getEventStartDate(event);
        const isPast = d && d < now;
        const needsUpdate = event.needsDateUpdate;
        const s = event.urlStatus;
        const statusDot = s
          ? \`<span class="cal-status-dot \${s.ok ? "cal-status-ok" : "cal-status-err"}" title="\${s.ok ? "Lien actif" : "Lien mort — vérifier"}"></span>\`
          : \`<span class="cal-status-dot cal-status-unknown" title="Non vérifié"></span>\`;
        const star = event.priority === "high" ? '<span class="cal-priority-star">★</span>' : "";
        const label = event.name.length > 32 ? event.name.slice(0, 30) + "…" : event.name;
        return \`<button type="button" class="cal-chip cal-chip-\${t}\${isPast ? " cal-past" : ""}\${needsUpdate ? " cal-needs-update" : ""}" data-cal-event="\${event.id}" title="\${escapeHtml(event.name)} — \${escapeHtml(event.dateLabel || event.window)}">\${star}\${label}\${statusDot}</button>\`;
      }

      const needsUpdateCount = dated.filter((e) => e.needsDateUpdate).length;
      const noticeHtml = needsUpdateCount > 0
        ? \`<div class="cal-needs-update-notice" style="margin-bottom:16px;">⚠ \${needsUpdateCount} événement\${needsUpdateCount > 1 ? "s" : ""} avec date passée — vérifier la prochaine édition</div>\`
        : "";

      const timelineHtml = months.map(({ year, month }) => {
        const key = \`\${year}-\${month}\`;
        const monthEvents = byMonth[key];
        if (!monthEvents?.length) return "";
        const isCurrent = year === now.getFullYear() && month === now.getMonth();
        return \`<div class="cal-month-row\${isCurrent ? " cal-current-month" : ""}">
          <div class="cal-month-label">\${MONTHS_FR[month]}<br>\${year}</div>
          <div class="cal-month-chips">\${monthEvents.map(chipHtml).join("")}</div>
        </div>\`;
      }).filter(Boolean).join("");

      const recurringHtml = recurring.length ? \`
        <div class="cal-recurring-block">
          <div class="cal-recurring-title">Récurrents — présents toute l'année</div>
          <div class="cal-month-chips">\${recurring.map(chipHtml).join("")}</div>
        </div>
      \` : "";

      const legendHtml = \`<div class="cal-legend">
        <div class="cal-legend-item"><div class="cal-legend-dot" style="background:rgba(143,62,105,0.55)"></div>Salon industriel</div>
        <div class="cal-legend-item"><div class="cal-legend-dot" style="background:rgba(47,125,96,0.55)"></div>Chambre de commerce</div>
        <div class="cal-legend-item"><div class="cal-legend-dot" style="background:rgba(199,133,90,0.55)"></div>Networking</div>
        <div class="cal-legend-item"><div class="cal-legend-dot" style="background:rgba(59,114,183,0.55)"></div>Association</div>
        <div class="cal-legend-item"><span class="cal-status-dot cal-status-ok" style="display:inline-block"></span>Lien vérifié actif</div>
        <div class="cal-legend-item"><span class="cal-status-dot cal-status-err" style="display:inline-block"></span>Lien mort</div>
        <div class="cal-legend-item">★ Priorité haute</div>
        <div class="cal-legend-item" style="font-style:italic;border-left:2px dashed var(--warn);padding-left:6px;">Date passée à confirmer</div>
      </div>\`;

      eventsCalendarEl.innerHTML = noticeHtml
        + \`<div class="cal-timeline">\${timelineHtml || '<div class="empty-state">Aucun événement daté.</div>'}</div>\`
        + recurringHtml
        + legendHtml;

      eventsCalendarEl.querySelectorAll("[data-cal-event]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.eventsView = "fiches";
          state.eventTypeFilter = "";
          renderEvents();
          requestAnimationFrame(() => {
            const card = document.querySelector(\`[data-event-id="\${btn.dataset.calEvent}"]\`);
            if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        });
      });
    }

    function renderSalonsStrip(salons) {
      const now = new Date();
      const yearToShow = 2026;
      const byMonth = {};
      salons.forEach((e) => {
        const d = getEventStartDate(e);
        if (!d || d.getFullYear() !== yearToShow) return;
        const m = d.getMonth();
        if (!byMonth[m]) byMonth[m] = [];
        byMonth[m].push(e);
      });
      const stripHtml = MONTHS_FR_SHORT.map((lbl, idx) => {
        const evs = byMonth[idx] || [];
        const isCurrent = idx === now.getMonth() && now.getFullYear() === yearToShow;
        const isPast = new Date(yearToShow, idx + 1, 0) < now;
        const maxPrio = evs.some((e) => e.priority === "high") ? "high" : evs.length ? "medium" : "empty";
        const dotClass = maxPrio === "high" ? "strip-dot-high" : maxPrio === "medium" ? "strip-dot-medium" : "strip-dot-empty";
        const cls = ["annual-strip-month", evs.length ? "has-events" : "", isCurrent ? "is-current" : "", isPast ? "is-past" : ""].filter(Boolean).join(" ");
        const title = \`\${MONTHS_FR[idx]} \${yearToShow}\${evs.length ? " — " + evs.length + " salon" + (evs.length > 1 ? "s" : "") : ""}\`;
        return \`<div class="\${cls}" data-strip-month="\${idx}" title="\${title}">
          <span class="strip-lbl">\${lbl}</span>
          <div class="strip-dot \${dotClass}"></div>
          <span class="strip-count">\${evs.length || ""}</span>
        </div>\`;
      }).join("");
      return \`<div class="annual-strip">\${stripHtml}</div>\`;
    }

    function renderEventRow(event) {
      const d = getEventStartDate(event);
      const isPast = d && d < new Date();
      const star = event.priority === "high" ? "★" : "·";
      const dateCity = [event.dateLabel || event.window, event.city].filter(Boolean).join(" · ");
      const targets = (event.targetCompanies || []).map((t) => \`<span class="event-target-tag">\${escapeHtml(t)}</span>\`).join("");
      const link = event.sourceUrl
        ? \`<a class="event-source-link" href="\${event.sourceUrl}" target="_blank" rel="noreferrer">→ \${escapeHtml(event.sourceLabel || "Site officiel")}</a>\`
        : "";
      const body = [
        event.icpFit ? \`<p class="event-icp">\${escapeHtml(event.icpFit)}</p>\` : "",
        \`<div class="event-details-grid">\`,
        event.angle ? \`<div class="edf"><span class="edf-label">Angle</span><span class="edf-value">\${escapeHtml(event.angle)}</span></div>\` : "",
        targets ? \`<div class="edf"><span class="edf-label">Cibles</span><div class="event-targets">\${targets}</div></div>\` : "",
        event.nextAction ? \`<div class="edf"><span class="edf-label">Next action</span><span class="edf-value edf-action">\${escapeHtml(event.nextAction)}</span></div>\` : "",
        \`</div>\`,
        link
      ].filter(Boolean).join("");
      const icpPreview = event.icpFit ? \`<span class="event-row-icp-preview">\${escapeHtml(event.icpFit)}</span>\` : "";
      return \`<details class="event-row\${isPast ? " is-past" : ""}" data-event-id="\${event.id}" data-event-type="\${event.type}">
        <summary>
          <span class="event-row-priority">\${star}</span>
          <div class="event-row-main">
            <span class="event-row-name">\${escapeHtml(event.name)}</span>
            <div class="event-row-meta">
              <span class="event-row-date">\${escapeHtml(dateCity)}</span>
              \${event.vertical ? \`<span class="event-row-vertical">\${escapeHtml(event.vertical)}</span>\` : ""}
            </div>
            \${icpPreview}
          </div>
          <span class="event-row-arrow">▾</span>
        </summary>
        <div class="event-row-body">\${body}</div>
      </details>\`;
    }

    function renderEvents() {
      const events = data.events || [];
      const now = new Date();
      const sortByDate = (a, b) => {
        const da = getEventStartDate(a), db = getEventStartDate(b);
        if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
        return da - db;
      };
      const typeFilter = state.eventsTypeFilter;
      const isUpcoming = typeFilter === "upcoming";
      const typeOnly = !["all", "upcoming"].includes(typeFilter) ? typeFilter : null;

      const allSorted = [...events].sort(sortByDate);
      let filtered = allSorted;
      if (isUpcoming) filtered = filtered.filter((e) => { const d = getEventStartDate(e); return d && d >= now; });
      if (typeOnly) filtered = filtered.filter((e) => e.type === typeOnly);

      const salonsForStrip = allSorted.filter((e) => e.type === "salon");
      const strippedSalons = isUpcoming ? salonsForStrip.filter((e) => { const d = getEventStartDate(e); return d && d >= now; }) : salonsForStrip;
      if (salonsCalendarStripEl) {
        salonsCalendarStripEl.innerHTML = (!typeOnly || typeOnly === "salon") ? renderSalonsStrip(strippedSalons) : "";
        salonsCalendarStripEl.querySelectorAll("[data-strip-month]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const monthIdx = parseInt(btn.dataset.stripMonth, 10);
            if (!eventsListEl) return;
            const rows = Array.from(eventsListEl.querySelectorAll(".event-row"));
            for (const row of rows) {
              const ev = filtered.find((e) => e.id === row.dataset.eventId);
              if (!ev) continue;
              const d = getEventStartDate(ev);
              if (d && d.getMonth() === monthIdx) { row.scrollIntoView({ behavior: "smooth", block: "center" }); break; }
            }
          });
        });
      }

      if (!eventsListEl) return;
      if (filtered.length === 0) {
        eventsListEl.innerHTML = \`<div class="empty-state">Aucun événement pour ce filtre.</div>\`;
        return;
      }

      const TYPE_META = {
        salon: { label: "① Salons", cssType: "salon" },
        association: { label: "② Associations & Congrès", cssType: "association" },
        chambre: { label: "③ Chambres de commerce", cssType: "chambre" },
        networking: { label: "④ Networking", cssType: "networking" }
      };
      const TYPE_ORDER = ["salon", "association", "chambre", "networking"];
      const groups = TYPE_ORDER.map((type) => ({ type, meta: TYPE_META[type], events: filtered.filter((e) => e.type === type) })).filter((g) => g.events.length > 0);
      const showGroups = groups.length > 1;

      eventsListEl.innerHTML = groups.map((g, gi) => {
        const sep = showGroups
          ? \`<div class="events-group-sep type-\${g.meta.cssType}\${gi === 0 ? " first" : ""}"><span class="events-group-sep-label">\${g.meta.label}</span><span class="events-group-sep-line"></span></div>\`
          : "";
        return sep + \`<div class="events-list">\${g.events.map(renderEventRow).join("")}</div>\`;
      }).join("");
    }

    const PARTNER_TYPE_LABELS = {
      comptable: "Cabinet comptable",
      transformation: "Conseil en transformation",
      financement: "Financement / gouvernement",
      association: "Association sectorielle"
    };

    const PARTNER_TYPE_GROUPS = [
      { key: "comptable", label: "Cabinets comptables" },
      { key: "financement", label: "Financement & gouvernement" },
      { key: "transformation", label: "Conseil en transformation" },
      { key: "association", label: "Associations sectorielles" }
    ];

    function renderPartnerCard(partner) {
      const typeKey = partner.type || "comptable";
      const typePill = \`pill-partner-\${typeKey}\`;
      const typeLabel = PARTNER_TYPE_LABELS[typeKey] || typeKey;
      const linkedinLink = partner.linkedinUrl
        ? \`<a class="partner-link" href="\${partner.linkedinUrl}" target="_blank" rel="noreferrer">LinkedIn</a>\`
        : "";
      const websiteLink = partner.website
        ? \`<a class="partner-link" href="https://\${partner.website}" target="_blank" rel="noreferrer">\${partner.website}</a>\`
        : "";
      return \`
        <article class="panel partner-card">
          <div class="section-head">
            <div>
              <h4>\${partner.name}</h4>
              <p class="section-subtext">\${partner.city}</p>
            </div>
            <span class="pill">\${partner.priority}</span>
          </div>
          <div class="pill-row">
            <span class="\${typePill}">\${typeLabel}</span>
            \${partner.size ? \`<span class="pill">\${partner.size}</span>\` : ""}
          </div>
          <div><strong class="field-label">Pourquoi ce partenaire</strong><p class="section-subtext">\${partner.why}</p></div>
          <div><strong class="field-label">Profil de leurs clients</strong><p class="section-subtext">\${partner.clientProfile}</p></div>
          <div><strong class="field-label">Comment les approcher</strong><p class="section-subtext">\${partner.approach}</p></div>
          <div><strong class="field-label">Ce qu'on leur dit</strong><p class="section-subtext">\${partner.angle}</p></div>
          <div><strong class="field-label">Ce qu'ils y gagnent</strong><p class="section-subtext">\${partner.whatTheyGain}</p></div>
          <div><strong class="field-label">Première action</strong><div class="partner-step">\${partner.firstStep}</div></div>
          \${linkedinLink || websiteLink ? \`<div class="pill-row" style="gap:12px;">\${linkedinLink}\${websiteLink}</div>\` : ""}
        </article>
      \`;
    }

    function renderPartners() {
      if (!partnersGridEl) return;
      const partners = data.partners || [];
      const filtered = state.partnerTypeFilter
        ? partners.filter((p) => p.type === state.partnerTypeFilter)
        : partners;

      if (state.partnerTypeFilter) {
        partnersGridEl.innerHTML = '<div class="partners-grid">' + filtered.map(renderPartnerCard).join("") + '</div>';
      } else {
        partnersGridEl.innerHTML = '<div class="partners-groups">' +
          PARTNER_TYPE_GROUPS.map(({ key, label }) => {
            const group = filtered.filter((p) => (p.type || "comptable") === key);
            if (!group.length) return "";
            return \`
              <div>
                <div class="partners-group-label">\${label} (\${group.length})</div>
                <div class="partners-grid">\${group.map(renderPartnerCard).join("")}</div>
              </div>
            \`;
          }).filter(Boolean).join("") +
        '</div>';
      }

      if (partnerTypeFilterEl) partnerTypeFilterEl.value = state.partnerTypeFilter;
    }

    function renderFilters() {
      const sectors = [...new Set(data.prospects.map((item) => item.sectorGroup).filter(Boolean))].sort((a, b) => { if (a === "Autre") return 1; if (b === "Autre") return -1; return a.localeCompare(b, "fr"); });
      industryFilterEl.innerHTML = ['<option value="">Toutes les industries</option>', ...sectors.map((s) => '<option value="' + s.replace(/"/g, "&quot;") + '">' + s + '</option>')].join("");
      industryFilterEl.value = state.sector;
      scoreFilterEl.value = String(state.minScore);
      statusFilterEl.value = state.status;
      searchMirrorEl.value = state.search;
    }

    function renderTabs() {
      Object.entries(tabPanels).forEach(([key, panel]) => {
        panel.classList.toggle("active", state.tab === key);
      });
    }

    function render() {
      renderTabNav();
      renderHero();
      renderLearning();
      renderFilters();
      renderTabs();
      renderProspects();
      renderVeille();
      renderPlaybooks();
      renderEvents();
      renderPartners();
    }

    searchMirrorEl.addEventListener("input", (event) => { state.search = event.target.value; renderProspects(); renderFilters(); });
    industryFilterEl.addEventListener("change", (event) => { state.sector = event.target.value; renderProspects(); renderFilters(); });
    scoreFilterEl.addEventListener("change", (event) => { state.minScore = parseFloat(event.target.value) || 0; renderProspects(); });
    statusFilterEl.addEventListener("change", (event) => { state.status = event.target.value; renderProspects(); });
    document.querySelectorAll("[data-events-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.eventsTypeFilter = btn.dataset.eventsType;
        document.querySelectorAll("[data-events-type]").forEach((b) => b.classList.toggle("active", b.dataset.eventsType === state.eventsTypeFilter));
        renderEvents();
      });
    });
    partnerTypeFilterEl.addEventListener("change", (event) => { state.partnerTypeFilter = event.target.value; renderPartners(); });
    prospectViewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.prospectView = button.dataset.prospectView;
        renderProspects();
      });
    });

    refreshBtnEl.addEventListener("click", async () => {
      if (!window.location.protocol.startsWith("http")) return;
      refreshBtnEl.disabled = true;
      refreshBtnEl.classList.add("refreshing");
      refreshBtnEl.textContent = "↻ En cours...";
      try {
        const response = await fetch("/api/refresh", { method: "POST" });
        if (response.ok) {
          data = await response.json();
          render();
        }
      } catch (error) {
        console.error("refresh_failed", error);
      } finally {
        refreshBtnEl.disabled = false;
        refreshBtnEl.classList.remove("refreshing");
        refreshBtnEl.textContent = "↻ Actualiser";
      }
    });

    async function init() {
      render();
      try {
        await refreshData();
        render();
      } catch (error) {
        console.error("dashboard_refresh_failed", error);
      }
    }

    init();

    // Auto-refresh toutes les 60s, seulement si l'onglet est visible
    setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await refreshData();
        render();
      } catch (_) {}
    }, 60000);
  </script>
</body>
</html>`;
}
