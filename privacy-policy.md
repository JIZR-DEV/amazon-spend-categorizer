# Privacy Policy — Amazon Spend Categorizer

_Last updated: 2026-06-10_

## Summary
**No data leaves your device.**

## Data collected
This extension does not collect, transmit, or share any personal data.

## What stays on your device
- Your Amazon order history (imported via CSV or read from the page DOM) is processed entirely in your browser and stored only in `browser.storage.local` on your device.
- Categorization flags (deductible/business/personal) per item are stored in `browser.storage.local`.
- Categorization rules (keywords, ASINs, categories) are stored in `browser.storage.local`.

## Optional sync
If you explicitly enable "Sync ruleset across devices" in Options, **only your categorization rules** (keywords/ASINs/categories) will be stored in `browser.storage.sync` to sync across your own browser profile. Your purchase data is **never** synced.

## Network requests
This extension makes zero network requests. There are no external servers, analytics, or tracking of any kind.

## Third-party libraries
- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) (Mozilla, MPL-2.0) — browser API compatibility
- [Papa Parse](https://www.papaparse.com/) (MIT) — CSV parsing, runs entirely client-side

## Permissions
- `storage` — to persist your rules and item flags locally
- `downloads` — to save the enriched CSV export to your Downloads folder
- `activeTab` — to read the Amazon order history DOM only when you click the extension icon

## Contact
For questions or concerns, contact: joseignaciozavalarocha@gmail.com

## Disclaimer
This extension is an independent tool and is not affiliated with, endorsed by, or sponsored by Amazon. "Amazon" and all related marks are trademarks of Amazon.com, Inc. or its affiliates.
