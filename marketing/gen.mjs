// gen.mjs — genera fixtures HTML de marketing para las capturas de la store.
// Reutiliza el CSS real de la extensión + datos de muestra (sin marca de Amazon).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "..", "src");
const innerDir = join(root, "_inner");
mkdirSync(innerDir, { recursive: true });

const popupCss = readFileSync(join(src, "popup.css"), "utf8");
const optionsCss = readFileSync(join(src, "options.css"), "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// --- Datos de muestra (genéricos, sin datos reales ni marca) ---
const items = [
  ["USB-C to USB-C Cable 6ft (2-Pack)", "B08L5W9R3T", "2026-01-08", "13.99", "Office Supplies", "Cables", "yes", "business"],
  ["Wireless Mechanical Keyboard", "B07Z4QKMN2", "2026-01-15", "84.90", "Equipment", "Peripherals", "yes", "business"],
  ["Ergonomic Laptop Stand", "B09FG7H8K1", "2026-01-22", "32.50", "Equipment", "Accessories", "yes", "business"],
  ["Organic Coffee Beans 2lb", "B06XW3M5PQ", "2026-02-03", "21.75", "Groceries", "", "no", "personal"],
  ["Printer Paper 500 Sheets", "B01N9SP8R4", "2026-02-11", "9.49", "Office Supplies", "Paper", "yes", "business"],
  ["Noise-Cancelling Headphones", "B08PZHYWJ5", "2026-02-19", "129.00", "Equipment", "Audio", "no", "personal"],
  ["Standing Desk Converter", "B07D5K2L9M", "2026-03-04", "159.99", "Equipment", "Furniture", "yes", "business"],
  ["Hardcover Notebook (3-Pack)", "B00LXR7QFE", "2026-03-12", "18.25", "Office Supplies", "Stationery", "yes", "business"],
];

const summary = {
  cats: ["Office Supplies", "Equipment", "Groceries"],
  rows: [
    ["Jan 2026", [13.99, 117.40, 0], 131.39],
    ["Feb 2026", [9.49, 129.00, 21.75], 160.24],
    ["Mar 2026", [18.25, 159.99, 0], 178.24],
  ],
};

const rules = [
  [10, "cable", "", "Office Supplies", "Cables", "Yes", "Business"],
  [10, "keyboard", "", "Equipment", "Peripherals", "Yes", "Business"],
  [10, "headphones", "", "Equipment", "Audio", "No", "Personal"],
  [20, "coffee", "", "Groceries", "", "No", "Personal"],
  [20, "paper", "", "Office Supplies", "Paper", "Yes", "Business"],
  [30, "", "B07D5K2L9M", "Equipment", "Furniture", "Yes", "Business"],
];

// Badges coloreados (legibles en captura) usando las clases de color reales
const dedBadge = (v) =>
  v === "yes" ? `<span class="badge tag-deductible-yes">Yes</span>`
  : v === "no" ? `<span class="badge tag-deductible-no">No</span>` : "-";
const bizBadge = (v) =>
  v === "business" ? `<span class="badge tag-business">Business</span>`
  : v === "personal" ? `<span class="badge tag-personal">Personal</span>` : "-";

const itemsRows = items.map(([t, a, d, amt, cat, sub, ded, biz]) => `
      <tr>
        <td class="col-title" title="${esc(t)}">${esc(t)}</td>
        <td>${esc(a)}</td>
        <td>${esc(d)}</td>
        <td class="col-amount">${esc(amt)}</td>
        <td class="col-category">${esc(cat)}</td>
        <td>${esc(sub)}</td>
        <td>${dedBadge(ded)}</td>
        <td>${bizBadge(biz)}</td>
      </tr>`).join("");

const itemsTable = `
  <table class="items-table">
    <thead><tr>
      <th class="col-title">Title</th><th>ASIN</th><th>Date</th><th class="col-amount">Amount</th>
      <th>Category</th><th>Subcategory</th><th>Deductible</th><th>Biz/Personal</th>
    </tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>`;

const summaryRows = summary.rows.map(([m, vals, tot]) => `
      <tr><td>${m}</td>${vals.map((v) => `<td>${v > 0 ? v.toFixed(2) : "-"}</td>`).join("")}<td>${tot.toFixed(2)}</td></tr>`).join("");

const summaryTable = `
  <table class="summary-table">
    <thead><tr><th>Month</th>${summary.cats.map((c) => `<th>${c}</th>`).join("")}<th>Total</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>`;

// Estilos extra para los badges (solo para las capturas)
const badgeCss = `
  .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:600; }
  .badge.tag-deductible-yes { background:#e6f4ea; color:#1e7e34; }
  .badge.tag-deductible-no { background:#fdecea; color:#c62828; }
  .badge.tag-business { background:#e7f0fb; color:#1565c0; }
  .badge.tag-personal { background:#f3e8fb; color:#6a1b9a; }
  body { max-height:none !important; overflow:visible !important; }
  #items-table-wrap { max-height:none !important; overflow:visible !important; }
  .pulse { box-shadow:0 0 0 3px rgba(255,153,0,.45), 0 0 18px rgba(255,153,0,.5) !important; }
`;

function popupInner({ status = "", summaryFirst = false, importPulse = false, exportPulse = false, exportEnabled = false } = {}) {
  const statusBar = status ? `<div id="status-bar" style="display:block">${esc(status)}</div>` : "";
  const summaryBlock = `<section class="summary-section"><h2>Monthly summary</h2><div>${summaryTable}</div></section>`;
  const itemsBlock = `<section class="items-section"><div id="items-table-wrap">${itemsTable}</div></section>`;
  const body = summaryFirst ? summaryBlock + itemsBlock : summaryBlock + itemsBlock;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${popupCss}\n${badgeCss}</style></head>
<body>
  <header><h1>Spend Categorizer</h1><div class="header-actions"><a href="#">&#9881;</a></div></header>
  <div class="toolbar">
    <button class="btn btn-primary${importPulse ? " pulse" : ""}">Import CSV</button>
    <button class="btn">Read page orders</button>
    <button class="btn btn-export${exportPulse ? " pulse" : ""}"${exportEnabled ? "" : " disabled"}>Export CSV</button>
  </div>
  ${statusBar}
  ${body}
  <section class="donate">
    <p class="donate-heading">Support this project</p>
    <a class="donate-btn paypal" href="#">Donate with PayPal</a>
    <a class="donate-btn kofi" href="#">Support me on Ko-fi</a>
  </section>
  <p class="disclaimer">Not affiliated with, endorsed by, or sponsored by Amazon. Amazon and all related marks are trademarks of Amazon.com, Inc. or its affiliates.</p>
</body></html>`;
}

function optionsInner() {
  const rfRows = rules.map(([p, kw, asin, cat, sub, ded, biz]) => `
      <tr>
        <td>${p}</td><td>${esc(kw)}</td><td>${esc(asin)}</td><td>${esc(cat)}</td>
        <td>${esc(sub)}</td><td>${ded}</td><td>${biz}</td>
        <td class="rule-actions"><button class="btn btn-sm">Edit</button><button class="btn btn-sm btn-danger">Delete</button></td>
      </tr>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${optionsCss}\n.badge{display:none}</style></head>
<body>
  <h1>Options</h1>
  <section class="section-card">
    <h2>Categorization Rules</h2>
    <div class="rules-toolbar">
      <button class="btn btn-primary">+ Add rule</button>
      <button class="btn">Import ruleset JSON</button>
      <button class="btn">Export ruleset JSON</button>
    </div>
    <div id="rules-table-wrap">
      <table class="rules-table">
        <thead><tr><th>Priority</th><th>Keyword</th><th>ASIN</th><th>Category</th><th>Subcategory</th><th>Deductible</th><th>Biz/Personal</th><th></th></tr></thead>
        <tbody>${rfRows}</tbody>
      </table>
    </div>
  </section>
  <section class="section-card">
    <h2>Ruleset Sync</h2>
    <div class="sync-row">
      <input type="checkbox" id="c" checked>
      <div class="sync-label"><strong>Sync ruleset across devices</strong><small>Only your categorization rules will sync — never your purchase data.</small></div>
    </div>
  </section>
  <p class="disclaimer">Not affiliated with, endorsed by, or sponsored by Amazon. Amazon and all related marks are trademarks of Amazon.com, Inc. or its affiliates.</p>
</body></html>`;
}

// --- Escribe los inner ---
const inners = {
  "popup-categorized.html": popupInner({}),
  "popup-summary.html": popupInner({ summaryFirst: true }),
  "popup-import.html": popupInner({ status: "8 items loaded from CSV.", importPulse: true }),
  "popup-export.html": popupInner({ status: "Export complete. Saved categorized-orders.csv", exportPulse: true, exportEnabled: true }),
  "options-rules.html": optionsInner(),
};
for (const [name, html] of Object.entries(inners)) writeFileSync(join(innerDir, name), html, "utf8");

// --- Stages 1280x800 con iframe + titular ---
function stage({ inner, w, h, chip, headline }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  .stage{width:1280px;height:800px;box-sizing:border-box;
    background:linear-gradient(135deg,#15202e 0%,#243447 55%,#34465a 100%);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:44px;
    font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
  .chip{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);color:#e8edf2;
    border:1px solid rgba(255,255,255,.16);padding:7px 15px;border-radius:999px;font-size:13px;font-weight:600}
  .headline{color:#fff;font-size:29px;font-weight:750;text-align:center;max-width:940px;line-height:1.18;letter-spacing:-.01em}
  .headline .accent{color:#ff9900}
  .device{border-radius:13px;overflow:hidden;background:#f8f9fa;
    box-shadow:0 30px 72px rgba(0,0,0,.46),0 0 0 1px rgba(255,255,255,.06)}
  iframe{border:0;display:block}
</style></head><body>
  <div class="stage">
    <div class="chip">🔒 ${chip}</div>
    <div class="headline">${headline}</div>
    <div class="device"><iframe src="_inner/${inner}" width="${w}" height="${h}" scrolling="no"></iframe></div>
  </div>
</body></html>`;
}

const stages = {
  "screenshot-1.html": stage({ inner: "popup-categorized.html", w: 700, h: 540, chip: "100% on-device · no servers",
    headline: `Every order, <span class="accent">categorized automatically</span>` }),
  "screenshot-2.html": stage({ inner: "options-rules.html", w: 880, h: 470, chip: "Your rules, your device",
    headline: `Build <span class="accent">keyword &amp; ASIN rules</span> that auto-tag items` }),
  "screenshot-3.html": stage({ inner: "popup-summary.html", w: 700, h: 540, chip: "Tax season, sorted",
    headline: `See <span class="accent">monthly spend by category</span> at a glance` }),
  "screenshot-4.html": stage({ inner: "popup-import.html", w: 700, h: 540, chip: "Nothing leaves your browser",
    headline: `Import your <span class="accent">Amazon CSV</span> in one click` }),
  "screenshot-5.html": stage({ inner: "popup-export.html", w: 700, h: 540, chip: "Ready for Excel & accountants",
    headline: `Export an <span class="accent">enriched CSV</span> with tax flags` }),
};
for (const [name, html] of Object.entries(stages)) writeFileSync(join(root, name), html, "utf8");

console.log("Generados", Object.keys(inners).length, "inner +", Object.keys(stages).length, "stages en", root);
