"use strict";
// popup.js — UI principal del MVP

(function () {
  // Estado en memoria del popup (se pierde al cerrar; persistencia real en storage)
  let currentItems = []; // items enriquecidos actuales
  let currentRules = []; // ruleset cargado desde storage
  let currentFlags = {}; // flags por key (asin|date)

  const t = (key) => (window.extI18n ? window.extI18n.t(key) : key);

  // Referencias DOM
  const csvInput = document.getElementById("csv-file-input");
  const btnImport = document.getElementById("btn-import-csv");
  const btnRead = document.getElementById("btn-read-orders");
  const btnExport = document.getElementById("btn-export");
  const statusBar = document.getElementById("status-bar");
  const summarySection = document.getElementById("summary-section");
  const summaryWrap = document.getElementById("summary-table-wrap");
  const itemsWrap = document.getElementById("items-table-wrap");
  const emptyState = document.getElementById("empty-state");

  function setStatus(msg) {
    statusBar.textContent = msg;
  }

  // Inicialización
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      currentRules = await window.extStorage.getRuleset();
      if (!currentRules || currentRules.length === 0) {
        currentRules = window.extRulesEngine.DEFAULT_RULES;
        await window.extStorage.saveRuleset(currentRules);
      }
      currentFlags = await window.extStorage.getFlags();
    } catch (e) {
      setStatus("Storage error: " + e.message);
    }

    // Botón importar CSV
    btnImport.addEventListener("click", () => csvInput.click());
    csvInput.addEventListener("change", handleCsvImport);

    // Botón leer pedidos desde la pestaña activa
    btnRead.addEventListener("click", handleReadOrders);

    // Botón exportar
    btnExport.addEventListener("click", handleExport);
  });

  // --- Importar CSV ---
  function handleCsvImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        setStatus("Parsing CSV...");
        const rawItems = window.extCsvParse.parseCsvText(ev.target.result);
        if (rawItems.length === 0) {
          setStatus(t("errorCsvFormat") || "CSV format not recognized. No items found.");
          return;
        }
        await processItems(rawItems);
        setStatus(rawItems.length + " items loaded from CSV.");
        csvInput.value = "";
      } catch (err) {
        const msg = err.message === "errorCsvFormat"
          ? (t("errorCsvFormat") || "CSV format not recognized.")
          : "Error: " + err.message;
        setStatus(msg);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  // --- Leer pedidos desde DOM ---
  async function handleReadOrders() {
    setStatus("Reading orders from page...");
    btnRead.disabled = true;
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        setStatus(t("errorScrapeFailed") || "No active tab found.");
        return;
      }

      // Verifica que estamos en Amazon
      const url = tab.url || "";
      const isAmazon = [
        "amazon.com", "amazon.es", "amazon.co.uk",
        "amazon.de", "amazon.fr", "amazon.it", "amazon.com.mx"
      ].some((d) => url.includes(d));

      if (!isAmazon) {
        setStatus(t("errorScrapeFailed") || "Navigate to an Amazon order history page first.");
        btnRead.disabled = false;
        return;
      }

      const response = await browser.tabs.sendMessage(tab.id, { type: "SCRAPE_ORDERS" });

      if (!response || response.type === "SCRAPE_ERROR") {
        const detail = response ? response.error : "no response";
        const base = t("errorScrapeFailed") || "Could not read orders";
        setStatus(base + (detail ? " (" + detail + ")" : ""));
        btnRead.disabled = false;
        return;
      }

      if (response.type === "ORDERS_RESULT") {
        const rawItems = response.items || [];
        if (rawItems.length === 0) {
          setStatus("No order items found on this page. Navigate to order history.");
        } else {
          await processItems(rawItems);
          setStatus(rawItems.length + " orders read from page.");
        }
      }
    } catch (err) {
      const base = t("errorScrapeFailed") || "Scrape failed";
      setStatus(base + (err && err.message ? " (" + err.message + ")" : ""));
    } finally {
      btnRead.disabled = false;
    }
  }

  // --- Procesar items (aplicar reglas y flags, renderizar) ---
  async function processItems(rawItems) {
    // Aplica reglas
    const enriched = window.extRulesEngine.applyRules(rawItems, currentRules);

    // Aplica flags guardados (override manual previo)
    for (const item of enriched) {
      const key = window.extStorage.itemFlagKey(item.asin, item.date);
      const saved = currentFlags[key];
      if (saved) {
        if (saved.deductible !== undefined) item.deductible = saved.deductible;
        if (saved.businessPersonal !== undefined) item.businessPersonal = saved.businessPersonal;
        if (saved.category !== undefined) item.category = saved.category;
        if (saved.subcategory !== undefined) item.subcategory = saved.subcategory;
      }
    }

    currentItems = enriched;
    renderItemsTable(enriched);
    renderSummary(enriched);
    btnExport.disabled = enriched.length === 0;
  }

  // --- Renderizar tabla de items ---
  function renderItemsTable(items) {
    // Limpia
    while (itemsWrap.firstChild) itemsWrap.removeChild(itemsWrap.firstChild);

    if (!items || items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = t("valueUncategorized") || "Import a CSV or read orders from an Amazon page.";
      itemsWrap.appendChild(empty);
      return;
    }

    const table = document.createElement("table");
    table.className = "items-table";

    // Thead
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const cols = [
      { key: "colTitle", cls: "col-title" },
      { key: "colAsin", cls: "col-asin" },
      { key: "colDate", cls: "col-date" },
      { key: "colAmount", cls: "col-amount" },
      { key: "colCategory", cls: "col-category" },
      { key: "colSubcategory", cls: "col-subcategory" },
      { key: "colDeductible", cls: "col-deductible" },
      { key: "colBusinessPersonal", cls: "col-biz" }
    ];
    cols.forEach(({ key, cls }) => {
      const th = document.createElement("th");
      th.className = cls;
      th.textContent = t(key) || key;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    // Tbody
    const tbody = document.createElement("tbody");
    items.forEach((item, rowIdx) => {
      const tr = document.createElement("tr");

      // Title
      const tdTitle = document.createElement("td");
      tdTitle.className = "col-title";
      tdTitle.textContent = item.title || "";
      tdTitle.title = item.title || "";
      tr.appendChild(tdTitle);

      // ASIN
      const tdAsin = document.createElement("td");
      tdAsin.textContent = item.asin || "";
      tr.appendChild(tdAsin);

      // Date
      const tdDate = document.createElement("td");
      tdDate.textContent = item.date || "";
      tr.appendChild(tdDate);

      // Amount
      const tdAmount = document.createElement("td");
      tdAmount.className = "col-amount";
      tdAmount.textContent = item.amount || "";
      tr.appendChild(tdAmount);

      // Category (editable)
      const tdCat = document.createElement("td");
      tdCat.className = "col-category";
      const catInput = document.createElement("input");
      catInput.type = "text";
      catInput.className = "editable-select";
      catInput.value = item.category || "";
      if (!item.category) {
        catInput.placeholder = t("valueUncategorized") || "Uncategorized";
        catInput.classList.add("tag-uncategorized");
      }
      catInput.addEventListener("change", () => saveItemFlag(rowIdx, "category", catInput.value));
      tdCat.appendChild(catInput);
      tr.appendChild(tdCat);

      // Subcategory (editable)
      const tdSubcat = document.createElement("td");
      const subcatInput = document.createElement("input");
      subcatInput.type = "text";
      subcatInput.className = "editable-select";
      subcatInput.value = item.subcategory || "";
      subcatInput.addEventListener("change", () => saveItemFlag(rowIdx, "subcategory", subcatInput.value));
      tdSubcat.appendChild(subcatInput);
      tr.appendChild(tdSubcat);

      // Deductible (select)
      const tdDeductible = document.createElement("td");
      const selDed = document.createElement("select");
      selDed.className = "editable-select";
      const dedOptions = [
        { value: "", label: "-" },
        { value: "yes", label: t("valueDeductibleYes") || "Yes" },
        { value: "no", label: t("valueDeductibleNo") || "No" }
      ];
      dedOptions.forEach(({ value, label }) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        if (item.deductible === value) opt.selected = true;
        selDed.appendChild(opt);
      });
      selDed.addEventListener("change", () => {
        saveItemFlag(rowIdx, "deductible", selDed.value);
        updateDeductibleStyle(tdDeductible, selDed.value);
      });
      updateDeductibleStyle(tdDeductible, item.deductible);
      tdDeductible.appendChild(selDed);
      tr.appendChild(tdDeductible);

      // Business / Personal (select)
      const tdBiz = document.createElement("td");
      const selBiz = document.createElement("select");
      selBiz.className = "editable-select";
      const bizOptions = [
        { value: "", label: "-" },
        { value: "business", label: t("valueBusiness") || "Business" },
        { value: "personal", label: t("valuePersonal") || "Personal" }
      ];
      bizOptions.forEach(({ value, label }) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        if (item.businessPersonal === value) opt.selected = true;
        selBiz.appendChild(opt);
      });
      selBiz.addEventListener("change", () => {
        saveItemFlag(rowIdx, "businessPersonal", selBiz.value);
        updateBizStyle(tdBiz, selBiz.value);
      });
      updateBizStyle(tdBiz, item.businessPersonal);
      tdBiz.appendChild(selBiz);
      tr.appendChild(tdBiz);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    itemsWrap.appendChild(table);
  }

  function updateDeductibleStyle(cell, value) {
    cell.className = "";
    if (value === "yes") cell.classList.add("tag-deductible-yes");
    else if (value === "no") cell.classList.add("tag-deductible-no");
  }

  function updateBizStyle(cell, value) {
    cell.className = "";
    if (value === "business") cell.classList.add("tag-business");
    else if (value === "personal") cell.classList.add("tag-personal");
  }

  // Persiste flag de item en storage
  async function saveItemFlag(rowIdx, field, value) {
    const item = currentItems[rowIdx];
    if (!item) return;
    item[field] = value;
    const key = window.extStorage.itemFlagKey(item.asin, item.date);
    const existing = currentFlags[key] || {};
    existing[field] = value;
    currentFlags[key] = existing;
    try {
      await window.extStorage.saveFlags(currentFlags);
    } catch (e) {
      const base = t("errorStorageFull") || "Storage full";
      setStatus(base + (e && e.message ? " (" + e.message + ")" : ""));
    }
    // Re-renderiza el resumen con los datos actualizados
    renderSummary(currentItems);
  }

  // --- Renderizar resumen mensual ---
  function renderSummary(items) {
    if (!items || items.length === 0) {
      summarySection.hidden = true;
      return;
    }

    const aggregated = window.extAggregate.aggregateByMonthCategory(items);
    const months = window.extAggregate.sortedMonths(aggregated);
    const categories = window.extAggregate.allCategories(aggregated);

    if (months.length === 0) {
      summarySection.hidden = true;
      return;
    }

    summarySection.hidden = false;
    while (summaryWrap.firstChild) summaryWrap.removeChild(summaryWrap.firstChild);

    const table = document.createElement("table");
    table.className = "summary-table";

    // Thead: Month | Cat1 | Cat2 | ... | Total
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const thMonth = document.createElement("th");
    thMonth.textContent = "Month";
    headRow.appendChild(thMonth);
    categories.forEach((cat) => {
      const th = document.createElement("th");
      th.textContent = cat;
      headRow.appendChild(th);
    });
    const thTotal = document.createElement("th");
    thTotal.textContent = t("summaryTotalLabel") || "Total";
    headRow.appendChild(thTotal);
    thead.appendChild(headRow);
    table.appendChild(thead);

    // Tbody
    const tbody = document.createElement("tbody");
    months.forEach((month) => {
      const tr = document.createElement("tr");
      const tdMonth = document.createElement("td");
      tdMonth.textContent = month;
      tr.appendChild(tdMonth);

      categories.forEach((cat) => {
        const td = document.createElement("td");
        const val = aggregated[month][cat] || 0;
        td.textContent = val > 0 ? val.toFixed(2) : "-";
        tr.appendChild(td);
      });

      const tdTotal = document.createElement("td");
      tdTotal.textContent = (aggregated[month]._total || 0).toFixed(2);
      tr.appendChild(tdTotal);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    summaryWrap.appendChild(table);
  }

  // --- Exportar CSV ---
  async function handleExport() {
    if (currentItems.length === 0) return;
    btnExport.disabled = true;
    setStatus("Exporting...");
    try {
      const prefix = t("exportFilenamePrefix") || "amazon-orders";
      await window.extCsvExport.exportCsv(currentItems, prefix);
      setStatus("Export complete.");
    } catch (err) {
      setStatus("Export error: " + err.message);
    } finally {
      btnExport.disabled = currentItems.length === 0;
    }
  }
})();
