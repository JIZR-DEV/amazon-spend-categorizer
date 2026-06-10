# Changelog

All notable changes to Amazon Spend Categorizer are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-06-10

### Added
- Import Amazon order history CSV (File > "Download order history").
- DOM scraping of the Amazon order history page via activeTab permission (no broad host_permissions needed).
- Keyword and ASIN-based rules engine — automatically categorizes items on import.
- Editable columns per row: category, subcategory, deductible (yes/no), business/personal.
- Monthly aggregated spend summary by category.
- Re-export enriched CSV with all columns including fiscal flags.
- Full CRUD rules editor in Options page (add/edit/delete, import/export ruleset as JSON).
- Optional sync of categorization rules (not purchase data) via browser.storage.sync.
- Internationalization: EN, ES, PT, FR, DE, IT via _locales.
- Welcome page shown on first install; update page shown on version upgrade.
- Donate page with PayPal/Ko-fi links.
- Cross-browser support: Chrome/Chromium (MV3 service worker) and Firefox (MV3 background scripts, gecko id).
- webextension-polyfill for unified browser API across targets.
- Privacy-first: all purchase data remains on-device; no network requests.
