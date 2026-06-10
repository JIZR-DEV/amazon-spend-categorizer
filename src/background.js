"use strict";
// background.js — service worker (Chrome) / scripts (Firefox)

// Al instalar o actualizar
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.tabs.create({ url: browser.runtime.getURL("welcome.html") });
  } else if (details.reason === "update") {
    browser.tabs.create({ url: browser.runtime.getURL("update.html") });
  }
});

// Maneja mensajes del popup
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "TRIGGER_EXPORT") {
    handleExport(message).then(sendResponse).catch((err) => {
      sendResponse({ type: "EXPORT_ERROR", error: String(err) });
    });
    return true; // respuesta asíncrona
  }
});

async function handleExport({ filename, url }) {
  // El Blob URL lo genera el popup (URL.createObjectURL no existe en el service
  // worker MV3 de Chrome y Firefox rechaza descargas desde data: URLs).
  try {
    if (!url) throw new Error("Missing download URL");

    const downloadId = await browser.downloads.download({
      url: url,
      filename: filename || "export.csv",
      saveAs: true
    });

    return { type: "EXPORT_DONE", downloadId };
  } catch (err) {
    return { type: "EXPORT_ERROR", error: String(err) };
  }
}
