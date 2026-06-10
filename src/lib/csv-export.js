"use strict";
// lib/csv-export.js — serializa los items enriquecidos a CSV y dispara la descarga via background.

const CSV_HEADERS = [
  "orderId", "date", "asin", "title",
  "amount", "category", "subcategory",
  "deductible", "businessPersonal"
];

const HEADER_LABELS = {
  orderId: "Order ID",
  date: "Date",
  asin: "ASIN",
  title: "Title",
  amount: "Amount",
  category: "Category",
  subcategory: "Subcategory",
  deductible: "Deductible",
  businessPersonal: "Business/Personal"
};

function escapeCsvCell(value) {
  let str = String(value == null ? "" : value);
  // Mitiga CSV injection: si la celda empieza por un carácter que las hojas de
  // cálculo (Excel/Sheets) interpretan como fórmula, antepón una comilla simple.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  // Si contiene coma, comilla o salto de línea, envolver en comillas
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function itemsToCsvText(items) {
  const headerRow = CSV_HEADERS.map((k) => escapeCsvCell(HEADER_LABELS[k])).join(",");
  const rows = items.map((item) =>
    CSV_HEADERS.map((k) => escapeCsvCell(item[k] || "")).join(",")
  );
  return [headerRow, ...rows].join("\r\n");
}

// Envía el CSV al background para que lo descargue con browser.downloads.
// El Blob URL se genera aquí (contexto de página del popup), donde
// URL.createObjectURL existe en Chrome y Firefox; el service worker MV3 de
// Chrome no lo expone, y Firefox rechaza descargas desde data: URLs.
async function exportCsv(items, filenamePrefix) {
  const csvText = itemsToCsvText(items);
  const now = new Date();
  const stamp = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");
  const filename = (filenamePrefix || "amazon-orders") + "_" + stamp + ".csv";

  // BOM UTF-8 para que Excel reconozca acentos correctamente.
  const blob = new Blob(["﻿" + csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const response = await browser.runtime.sendMessage({
      type: "TRIGGER_EXPORT",
      filename: filename,
      url: url
    });

    if (response && response.type === "EXPORT_DONE") {
      return response.downloadId;
    }
    throw new Error(response ? response.error : "Export failed");
  } finally {
    // Revoca tras un margen para que la descarga haya iniciado la lectura.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

window.extCsvExport = {
  itemsToCsvText,
  exportCsv,
  CSV_HEADERS,
  HEADER_LABELS
};
