"use strict";
// Motor de i18n del DOM para la Extension Factory.
// Traduce los elementos marcados con data-i18n* usando browser.i18n.getMessage
// (sistema estándar _locales/ de las WebExtensions). NO evalúa código.
// Cárgalo DESPUÉS de browser-polyfill.js y ANTES de tu script de página.
(function () {
  const i18n =
    (typeof browser !== "undefined" && browser.i18n) ? browser.i18n :
    (typeof chrome !== "undefined" && chrome.i18n) ? chrome.i18n : null;

  function t(key, substitutions) {
    if (!i18n || !key) return "";
    return i18n.getMessage(key, substitutions) || "";
  }

  // [atributo-marcador, cómo se aplica el mensaje]
  const BINDINGS = [
    ["data-i18n", "text"],
    ["data-i18n-title", "title"],
    ["data-i18n-aria-label", "aria-label"],
    ["data-i18n-alt", "alt"],
    ["data-i18n-placeholder", "placeholder"],
  ];

  function apply(root) {
    const scope = root || document;
    for (const [attr, how] of BINDINGS) {
      scope.querySelectorAll("[" + attr + "]").forEach((el) => {
        const msg = t(el.getAttribute(attr));
        if (!msg) return;
        if (how === "text") el.textContent = msg;
        else el.setAttribute(how, msg);
      });
    }
    // <html lang> acorde al idioma efectivo de la UI.
    if (i18n && typeof i18n.getUILanguage === "function") {
      const lang = i18n.getUILanguage();
      if (lang) document.documentElement.setAttribute("lang", lang);
    }
  }

  function init() { apply(document); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // API para traducir strings dinámicos desde tus scripts: window.extI18n.t("clave")
  window.extI18n = { t: t, apply: apply };
})();
