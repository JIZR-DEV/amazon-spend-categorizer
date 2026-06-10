(function () {
  "use strict";

  // Escucha mensajes del popup (activos solo cuando activeTab lo permite)
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "SCRAPE_ORDERS") {
      try {
        const items = scrapeOrderHistory();
        sendResponse({ type: "ORDERS_RESULT", items });
      } catch (err) {
        sendResponse({ type: "SCRAPE_ERROR", error: String(err) });
      }
      return true;
    }
  });

  // Extrae pedidos del DOM de la página de historial de Amazon
  function scrapeOrderHistory() {
    const items = [];
    let idx = 0;

    // Selector para las tarjetas de pedido en amazon.com/order-history
    // Amazon usa clases distintas según la vista; intentamos varios selectores
    const orderCards = document.querySelectorAll(
      ".order, .a-box-group.order, [data-component='orderCard'], .yo-critical-feature"
    );

    if (orderCards.length === 0) {
      // Intenta la vista de tabla de artículos individuales
      return scrapeItemsTable();
    }

    orderCards.forEach((card) => {
      // Número de pedido
      const orderIdEl = card.querySelector(
        ".yohtmlc-order-id span:last-child, [class*='order-id'] span, .a-color-secondary.value"
      );
      const orderId = orderIdEl ? orderIdEl.textContent.trim() : "";

      // Fecha del pedido
      const dateEl = card.querySelector(
        ".order-date-invoice-item span, .a-color-secondary.label + .a-color-secondary.value, " +
        "[class*='order-date'], .a-size-base.a-color-secondary"
      );
      const date = dateEl ? dateEl.textContent.trim() : "";

      // Artículos dentro de la tarjeta
      const titleLinks = card.querySelectorAll(
        ".yohtmlc-product-title, .a-link-normal[href*='/dp/'], " +
        ".a-size-base-plus.a-color-base.a-text-bold, .item-title"
      );

      titleLinks.forEach((el) => {
        const title = el.textContent.trim();
        if (!title) return;

        // Extrae ASIN del href si es un enlace
        let asin = "";
        const href = el.href || (el.closest("a") ? el.closest("a").href : "");
        const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) asin = asinMatch[1];

        // Importe: busca en el contexto del artículo
        let amount = "";
        const amountEl = el.closest(".a-fixed-left-grid-inner, .item-box, .a-row")
          ? el.closest(".a-fixed-left-grid-inner, .item-box, .a-row").querySelector(
              "[class*='price'], .a-color-price, .a-price"
            )
          : null;
        if (amountEl) amount = amountEl.textContent.trim();

        items.push({
          id: "dom-" + idx++,
          title,
          asin,
          date,
          orderId,
          amount,
          source: "dom"
        });
      });
    });

    return items;
  }

  // Raspa la vista de tabla del historial de artículos (URL: /order-history?opt=ab&digitalOrders=...)
  function scrapeItemsTable() {
    const items = [];
    let idx = 0;

    const rows = document.querySelectorAll("table tr, .a-row");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td, .a-column");
      if (cells.length < 2) return;

      const title = cells[0] ? cells[0].textContent.trim() : "";
      if (!title) return;

      let asin = "";
      const link = row.querySelector("a[href*='/dp/']");
      if (link) {
        const m = link.href.match(/\/dp\/([A-Z0-9]{10})/);
        if (m) asin = m[1];
      }

      const amount = cells[cells.length - 1] ? cells[cells.length - 1].textContent.trim() : "";

      items.push({
        id: "dom-" + idx++,
        title,
        asin,
        date: "",
        orderId: "",
        amount,
        source: "dom"
      });
    });

    return items;
  }
})();
