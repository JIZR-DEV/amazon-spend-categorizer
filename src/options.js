"use strict";
// options.js — editor CRUD de reglas + control de sync

(function () {
  const t = (key) => (window.extI18n ? window.extI18n.t(key) : key);

  let rules = [];
  let syncConsent = false;

  const ruleForm = document.getElementById("rule-form");
  const ruleFormTitle = document.getElementById("rule-form-title");
  const rfKeyword = document.getElementById("rf-keyword");
  const rfAsin = document.getElementById("rf-asin");
  const rfCategory = document.getElementById("rf-category");
  const rfSubcategory = document.getElementById("rf-subcategory");
  const rfPriority = document.getElementById("rf-priority");
  const rfDeductible = document.getElementById("rf-deductible");
  const rfBiz = document.getElementById("rf-biz");
  const rfSave = document.getElementById("rf-save");
  const rfCancel = document.getElementById("rf-cancel");
  const rfEditingId = document.getElementById("rf-editing-id");

  const btnAddRule = document.getElementById("btn-add-rule");
  const btnImportRuleset = document.getElementById("btn-import-ruleset");
  const btnExportRuleset = document.getElementById("btn-export-ruleset");
  const rulesetFileInput = document.getElementById("ruleset-file-input");
  const rulesTbody = document.getElementById("rules-tbody");
  const syncChk = document.getElementById("sync-consent-chk");
  const statusMsg = document.getElementById("status-msg");

  function showStatus(msg, isError) {
    statusMsg.textContent = msg;
    statusMsg.style.display = "block";
    statusMsg.style.background = isError ? "#ffebee" : "#e8f5e9";
    statusMsg.style.color = isError ? "#c62828" : "#2e7d32";
    setTimeout(() => { statusMsg.style.display = "none"; }, 3000);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    rules = await window.extStorage.getRuleset();
    if (!rules || rules.length === 0) {
      rules = window.extRulesEngine.DEFAULT_RULES;
      await window.extStorage.saveRuleset(rules);
    }
    syncConsent = await window.extStorage.getSyncConsent();
    syncChk.checked = syncConsent;
    renderRulesTable();

    // Botón agregar regla
    btnAddRule.addEventListener("click", () => openRuleForm(null));

    // Botón guardar regla
    rfSave.addEventListener("click", saveRule);

    // Cancelar form
    rfCancel.addEventListener("click", () => { ruleForm.hidden = true; });

    // Import ruleset JSON
    btnImportRuleset.addEventListener("click", () => rulesetFileInput.click());
    rulesetFileInput.addEventListener("change", handleImportRuleset);

    // Export ruleset JSON
    btnExportRuleset.addEventListener("click", handleExportRuleset);

    // Toggle sync
    syncChk.addEventListener("change", async () => {
      await window.extStorage.setSyncConsent(syncChk.checked);
      showStatus(syncChk.checked ? "Sync enabled." : "Sync disabled.");
    });
  });

  function renderRulesTable() {
    while (rulesTbody.firstChild) rulesTbody.removeChild(rulesTbody.firstChild);

    const sorted = window.extRulesEngine.sortRules(rules);
    sorted.forEach((rule) => {
      const tr = document.createElement("tr");

      const fields = [
        rule.priority || "",
        rule.keyword || "",
        rule.asin || "",
        rule.category || "",
        rule.subcategory || "",
        rule.deductible || "",
        rule.businessPersonal || ""
      ];

      fields.forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val;
        tr.appendChild(td);
      });

      // Actions
      const tdActions = document.createElement("td");
      tdActions.className = "rule-actions";

      const btnEdit = document.createElement("button");
      btnEdit.className = "btn btn-sm";
      btnEdit.textContent = t("ruleEditBtn") || "Edit";
      btnEdit.addEventListener("click", () => openRuleForm(rule));

      const btnDel = document.createElement("button");
      btnDel.className = "btn btn-sm btn-danger";
      btnDel.textContent = t("ruleDeleteBtn") || "Delete";
      btnDel.addEventListener("click", () => deleteRule(rule.id));

      tdActions.appendChild(btnEdit);
      tdActions.appendChild(btnDel);
      tr.appendChild(tdActions);
      rulesTbody.appendChild(tr);
    });
  }

  function openRuleForm(rule) {
    ruleForm.hidden = false;
    if (rule) {
      ruleFormTitle.textContent = t("ruleEditBtn") || "Edit rule";
      rfEditingId.value = rule.id;
      rfKeyword.value = rule.keyword || "";
      rfAsin.value = rule.asin || "";
      rfCategory.value = rule.category || "";
      rfSubcategory.value = rule.subcategory || "";
      rfPriority.value = rule.priority || 50;
      rfDeductible.value = rule.deductible || "";
      rfBiz.value = rule.businessPersonal || "";
    } else {
      ruleFormTitle.textContent = t("ruleAddBtn") || "Add rule";
      rfEditingId.value = "";
      rfKeyword.value = "";
      rfAsin.value = "";
      rfCategory.value = "";
      rfSubcategory.value = "";
      rfPriority.value = 50;
      rfDeductible.value = "";
      rfBiz.value = "";
    }
    rfKeyword.focus();
  }

  async function saveRule() {
    const keyword = rfKeyword.value.trim();
    const asin = rfAsin.value.trim().toUpperCase();
    const category = rfCategory.value.trim();

    if (!keyword && !asin) {
      showStatus("Keyword or ASIN required.", true);
      return;
    }
    if (!category) {
      showStatus("Category required.", true);
      return;
    }

    const editingId = rfEditingId.value;
    const rule = {
      id: editingId || window.extRulesEngine.newRuleId(),
      priority: parseInt(rfPriority.value, 10) || 50,
      keyword,
      asin,
      category,
      subcategory: rfSubcategory.value.trim(),
      deductible: rfDeductible.value,
      businessPersonal: rfBiz.value
    };

    if (editingId) {
      const idx = rules.findIndex((r) => r.id === editingId);
      if (idx >= 0) rules[idx] = rule;
      else rules.push(rule);
    } else {
      rules.push(rule);
    }

    await window.extStorage.saveRuleset(rules);

    // Sincroniza si hay consentimiento
    if (syncConsent) {
      try { await browser.storage.sync.set({ ruleset: rules }); } catch (_) {}
    }

    ruleForm.hidden = true;
    renderRulesTable();
    showStatus(editingId ? "Rule updated." : "Rule added.");
  }

  async function deleteRule(id) {
    rules = rules.filter((r) => r.id !== id);
    await window.extStorage.saveRuleset(rules);
    if (syncConsent) {
      try { await browser.storage.sync.set({ ruleset: rules }); } catch (_) {}
    }
    renderRulesTable();
    showStatus("Rule deleted.");
  }

  // Import ruleset desde JSON
  function handleImportRuleset(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) {
          showStatus("Invalid ruleset JSON (expected array).", true);
          return;
        }
        // Valida mínimamente
        const valid = imported.filter((r) => r && (r.keyword || r.asin) && r.category);
        if (valid.length === 0) {
          showStatus("No valid rules found in JSON.", true);
          return;
        }
        // Asigna IDs nuevos si faltan
        valid.forEach((r) => { if (!r.id) r.id = window.extRulesEngine.newRuleId(); });
        rules = valid;
        await window.extStorage.saveRuleset(rules);
        renderRulesTable();
        showStatus(valid.length + " rules imported.");
        rulesetFileInput.value = "";
      } catch (err) {
        showStatus("JSON parse error: " + err.message, true);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  // Export ruleset como JSON
  function handleExportRuleset() {
    const jsonStr = JSON.stringify(rules, null, 2);
    const dataUrl = "data:application/json;charset=utf-8," + encodeURIComponent(jsonStr);
    browser.downloads.download({
      url: dataUrl,
      filename: "amazon-spend-categorizer-ruleset.json",
      saveAs: true
    }).catch((err) => showStatus("Export error: " + err.message, true));
  }
})();
