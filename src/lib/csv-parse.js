"use strict";
// lib/csv-parse.js — parsea el CSV de pedidos de Amazon usando Papa Parse (cargado aparte).
// Detecta las columnas relevantes de forma flexible (el CSV de Amazon varía por región/idioma).

// Columnas conocidas del CSV de Amazon por idioma:
// EN: "Title", "ASIN", "Order Date", "Order ID", "Item Total"
// ES: "Título", "ASIN", "Fecha del pedido", "Número de pedido", "Total del artículo"
// DE: "Titel", "ASIN", "Bestelldatum", "Bestellnummer", "Artikelpreis"
// FR: "Titre", "ASIN", "Date de la commande", "Numéro de commande", "Prix de l'article"

const COLUMN_ALIASES = {
  title: ["title", "título", "titre", "titel", "titolo", "produto", "product name", "item name", "name"],
  asin: ["asin"],
  date: ["order date", "fecha del pedido", "date de la commande", "bestelldatum", "data dell'ordine", "data do pedido", "date ordered"],
  orderId: ["order id", "número de pedido", "numéro de commande", "bestellnummer", "id dell'ordine", "id do pedido", "order #"],
  amount: ["item total", "total del artículo", "prix de l'article", "artikelpreis", "prezzo dell'articolo", "preço do artigo", "item price", "price", "total"]
};

function normalizeKey(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9áéíóúàèìòùäöüâêîôûñ ]/gi, "");
}

function detectColumns(headers) {
  const map = {};
  const normalizedHeaders = headers.map((h) => normalizeKey(h));

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      if (aliases.some((alias) => normalizedHeaders[i].includes(alias))) {
        map[field] = headers[i]; // usa el header original como clave
        break;
      }
    }
  }
  return map;
}

// Parsea el texto CSV usando Papa Parse. Retorna array de items normalizados.
// Requiere que Papa Parse esté disponible globalmente como window.Papa.
function parseCsvText(csvText) {
  if (!window.Papa) {
    throw new Error("Papa Parse not loaded");
  }
  const result = window.Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  if (result.errors && result.errors.length > 0) {
    const fatal = result.errors.filter((e) => e.type === "FieldMismatch" || e.type === "Delimiter");
    if (fatal.length > 0) {
      throw new Error("CSV parse error: " + fatal[0].message);
    }
  }

  const rows = result.data;
  if (!rows || rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const colMap = detectColumns(headers);

  if (!colMap.title && !colMap.asin) {
    throw new Error("errorCsvFormat");
  }

  return rows.map((row, idx) => ({
    id: "csv-" + idx,
    title: row[colMap.title] || "",
    asin: row[colMap.asin] || "",
    date: row[colMap.date] || "",
    orderId: row[colMap.orderId] || "",
    amount: row[colMap.amount] || "0",
    source: "csv"
  })).filter((item) => item.title || item.asin);
}

window.extCsvParse = {
  parseCsvText,
  detectColumns,
  normalizeKey
};
