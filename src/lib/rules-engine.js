"use strict";
// lib/rules-engine.js — motor de reglas keyword/ASIN → categoría/subcategoría/flag fiscal.
// Sin eval. Las reglas son objetos JS planos; se aplican en orden de prioridad (menor número = mayor prioridad).

// Estructura de una regla:
// { id, priority, keyword, asin, category, subcategory, deductible, businessPersonal }
// - keyword: string (se busca case-insensitive en el título) — opcional si hay asin
// - asin: string exacta (opcional, tiene precedencia sobre keyword)
// - category: string
// - subcategory: string (opcional)
// - deductible: "yes" | "no" | "" (vacío = sin flag)
// - businessPersonal: "business" | "personal" | "" (vacío = sin flag)

const DEFAULT_RULES = [
  { id: "default-1", priority: 100, keyword: "libro", asin: "", category: "Libros", subcategory: "", deductible: "", businessPersonal: "" },
  { id: "default-2", priority: 100, keyword: "book", asin: "", category: "Books", subcategory: "", deductible: "", businessPersonal: "" },
  { id: "default-3", priority: 100, keyword: "kindle", asin: "", category: "Books", subcategory: "Digital", deductible: "", businessPersonal: "" },
  { id: "default-4", priority: 100, keyword: "auricular", asin: "", category: "Electronica", subcategory: "Audio", deductible: "", businessPersonal: "" },
  { id: "default-5", priority: 100, keyword: "headphone", asin: "", category: "Electronics", subcategory: "Audio", deductible: "", businessPersonal: "" },
  { id: "default-6", priority: 100, keyword: "cable", asin: "", category: "Electronics", subcategory: "Cables", deductible: "", businessPersonal: "" },
  { id: "default-7", priority: 100, keyword: "camiseta", asin: "", category: "Ropa", subcategory: "", deductible: "", businessPersonal: "" },
  { id: "default-8", priority: 100, keyword: "shirt", asin: "", category: "Clothing", subcategory: "", deductible: "", businessPersonal: "" },
  { id: "default-9", priority: 100, keyword: "zapato", asin: "", category: "Calzado", subcategory: "", deductible: "", businessPersonal: "" },
  { id: "default-10", priority: 100, keyword: "juego", asin: "", category: "Videojuegos", subcategory: "", deductible: "", businessPersonal: "" },
  { id: "default-11", priority: 100, keyword: "game", asin: "", category: "Games", subcategory: "", deductible: "", businessPersonal: "" }
];

function sortRules(rules) {
  return [...rules].sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

// Aplica el ruleset a un artículo. Devuelve el primer match o null.
function matchItem(item, rules) {
  const sorted = sortRules(rules);
  const titleLower = (item.title || "").toLowerCase();

  for (const rule of sorted) {
    // Match por ASIN (exacto, mayor prioridad lógica)
    if (rule.asin && rule.asin.trim() !== "") {
      if (rule.asin.trim().toUpperCase() === (item.asin || "").trim().toUpperCase()) {
        return rule;
      }
      continue; // Si la regla tiene ASIN pero no coincide, saltar
    }
    // Match por keyword (case-insensitive en título)
    if (rule.keyword && rule.keyword.trim() !== "") {
      if (titleLower.includes(rule.keyword.trim().toLowerCase())) {
        return rule;
      }
    }
  }
  return null;
}

// Aplica el ruleset a un array de items. Devuelve items enriquecidos.
function applyRules(items, rules) {
  return items.map((item) => {
    const match = matchItem(item, rules);
    return Object.assign({}, item, {
      category: match ? match.category : "",
      subcategory: match ? (match.subcategory || "") : "",
      deductible: match ? (match.deductible || "") : "",
      businessPersonal: match ? (match.businessPersonal || "") : "",
      ruleMatched: match ? match.id : null
    });
  });
}

// Genera un ID único para una nueva regla
function newRuleId() {
  return "rule-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

window.extRulesEngine = {
  DEFAULT_RULES,
  sortRules,
  matchItem,
  applyRules,
  newRuleId
};
