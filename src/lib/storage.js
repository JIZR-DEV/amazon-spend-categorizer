"use strict";
// lib/storage.js — acceso a browser.storage.local (flags por ASIN+fecha) y ruleset.
// Todo es storage.local; sync solo si el usuario lo activa explícitamente en Options.

const KEYS = {
  RULES: "ruleset",
  FLAGS: "itemFlags",
  SYNC_CONSENT: "syncRulesetConsent"
};

async function getRuleset() {
  const data = await browser.storage.local.get(KEYS.RULES);
  return data[KEYS.RULES] || [];
}

async function saveRuleset(rules) {
  await browser.storage.local.set({ [KEYS.RULES]: rules });
}

async function getFlags() {
  const data = await browser.storage.local.get(KEYS.FLAGS);
  return data[KEYS.FLAGS] || {};
}

async function saveFlags(flags) {
  await browser.storage.local.set({ [KEYS.FLAGS]: flags });
}

async function getFlag(key) {
  const flags = await getFlags();
  return flags[key] || null;
}

async function setFlag(key, value) {
  const flags = await getFlags();
  flags[key] = value;
  await saveFlags(flags);
}

async function getSyncConsent() {
  const data = await browser.storage.local.get(KEYS.SYNC_CONSENT);
  return !!data[KEYS.SYNC_CONSENT];
}

async function setSyncConsent(value) {
  await browser.storage.local.set({ [KEYS.SYNC_CONSENT]: !!value });
  if (value) {
    // Sincroniza el ruleset al activar
    const rules = await getRuleset();
    try {
      await browser.storage.sync.set({ [KEYS.RULES]: rules });
    } catch (e) {
      console.warn("[amazon-spend-categorizer] sync.set failed:", e);
    }
  }
}

async function syncRulesetFromSync() {
  try {
    const data = await browser.storage.sync.get(KEYS.RULES);
    if (data[KEYS.RULES] && Array.isArray(data[KEYS.RULES])) {
      await saveRuleset(data[KEYS.RULES]);
      return data[KEYS.RULES];
    }
  } catch (e) {
    console.warn("[amazon-spend-categorizer] sync.get failed:", e);
  }
  return null;
}

// Genera clave única por artículo para flags
function itemFlagKey(asin, date) {
  return (asin || "NO_ASIN") + "|" + (date || "NO_DATE");
}

window.extStorage = {
  getRuleset,
  saveRuleset,
  getFlags,
  saveFlags,
  getFlag,
  setFlag,
  getSyncConsent,
  setSyncConsent,
  syncRulesetFromSync,
  itemFlagKey,
  KEYS
};
