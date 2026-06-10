"use strict";
// lib/aggregate.js — agrega gasto mensual por categoría.

// Normaliza una fecha a "YYYY-MM" para agrupar por mes.
function toMonthKey(dateStr) {
  if (!dateStr) return "unknown";
  // Acepta formatos: "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "Month DD, YYYY"
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Intenta DD/MM/YYYY
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      // Asume DD/MM/YYYY si el primer segmento > 12, sino MM/DD/YYYY
      if (parseInt(parts[0], 10) > 12) {
        d = new Date(parts[2] + "-" + parts[1].padStart(2, "0") + "-" + parts[0].padStart(2, "0"));
      } else {
        d = new Date(parts[2] + "-" + parts[0].padStart(2, "0") + "-" + parts[1].padStart(2, "0"));
      }
    }
  }
  if (isNaN(d.getTime())) return "unknown";
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

// Parsea el importe a número flotante (acepta "$1.234,56" o "1,234.56" o "12.34")
function parseAmount(amountStr) {
  if (typeof amountStr === "number") return amountStr;
  if (!amountStr) return 0;
  // Elimina símbolos de moneda y espacios
  let s = String(amountStr).replace(/[^\d.,\-]/g, "");
  // Detecta formato europeo: "1.234,56"
  if (s.match(/\d{1,3}\.\d{3},\d{2}$/)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.match(/\d{1,3},\d{3}\.\d{2}$/)) {
    // "1,234.56"
    s = s.replace(/,/g, "");
  } else {
    // Formato simple: reemplaza coma decimal
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Agrega items por mes y categoría.
// Retorna: { "2024-01": { "Electronica": 123.45, "Ropa": 67.89, "_total": 191.34 }, ... }
function aggregateByMonthCategory(items) {
  const result = {};
  for (const item of items) {
    const month = toMonthKey(item.date);
    const cat = item.category || "_uncategorized";
    const amount = parseAmount(item.amount);
    if (!result[month]) result[month] = { _total: 0 };
    if (!result[month][cat]) result[month][cat] = 0;
    result[month][cat] += amount;
    result[month]._total += amount;
  }
  // Redondea a 2 decimales
  for (const month of Object.keys(result)) {
    for (const cat of Object.keys(result[month])) {
      result[month][cat] = Math.round(result[month][cat] * 100) / 100;
    }
  }
  return result;
}

// Obtiene los meses ordenados cronológicamente
function sortedMonths(aggregated) {
  return Object.keys(aggregated).sort();
}

// Obtiene todas las categorías únicas del resultado
function allCategories(aggregated) {
  const cats = new Set();
  for (const month of Object.values(aggregated)) {
    for (const cat of Object.keys(month)) {
      if (cat !== "_total") cats.add(cat);
    }
  }
  return [...cats].sort();
}

window.extAggregate = {
  toMonthKey,
  parseAmount,
  aggregateByMonthCategory,
  sortedMonths,
  allCategories
};
