# Guia de envio a stores — Amazon Spend Categorizer v1.0.0

Fecha de preparacion: 2026-06-10
Artefactos generados en: dist/

---

## Artefactos

| Archivo             | Uso                                      |
|---------------------|------------------------------------------|
| dist/chrome.zip     | Upload a Chrome Web Store                |
| dist/firefox.zip    | Upload a Mozilla AMO                     |
| dist/source.zip     | Codigo fuente para revisor AMO (requerido si hay build step) |

---

## 1. Chrome Web Store

### Requisitos previos
- Cuenta de desarrollador en https://chrome.google.com/webstore/devconsole
- Pago unico de $5 USD si es cuenta nueva.
- Puede requerir 2FA segun la configuracion de la cuenta Google.

### Pasos

1. Ve a https://chrome.google.com/webstore/devconsole
2. Haz clic en "New item".
3. Sube `dist/chrome.zip`.
4. Rellena los campos del listing:

   - **Name**: Amazon Spend Categorizer
   - **Summary** (hasta 132 chars):
     Categorize your Amazon purchases locally with keyword/ASIN rules. Fiscal flags, CSV export. No data leaves your device.
   - **Description** (hasta 16 000 chars, usa el contenido de README.md como base):
     Incluye la lista de funcionalidades, la nota de privacidad y el enlace a donaciones.
     **OBLIGATORIO incluir al final de la descripcion la nota de no afiliacion** (evita rechazo por uso de marca):
     "Not affiliated with, endorsed by, or sponsored by Amazon. 'Amazon' is a trademark of Amazon.com, Inc. or its affiliates."
   - **Category**: Productivity
   - **Language**: English (add additional languages if desired)
   - **Icons**: ya incluidos en el zip (16, 48, 128 px).
   - **Screenshots**: minimo 1, maximo 5 (1280x800 o 640x400). Captura el popup, la tabla de pedidos categorizada y la pagina de opciones/reglas.
   - **Privacy Policy URL**: ya publicada en Gist publico:
     https://gist.github.com/JIZR-DEV/4cf770a87d086a0f8351e4c6e68ba83c

5. Seccion "Privacy practices":
   - Declara que la extension NO recopila datos personales del usuario.
   - Confirma que no se envian datos a servidores externos.
   - Los datos de compras se almacenan unicamente en storage.local del dispositivo del usuario.
   - Las reglas de categorizacion pueden sincronizarse opcionalmente via storage.sync entre dispositivos del mismo usuario (no con terceros).

6. Justificacion de permisos (campo "Single purpose description" y notas de revision):
   - `storage`: guardar las reglas de categorizacion en storage.local y, opcionalmente, sincronizarlas via storage.sync entre dispositivos propios del usuario.
   - `downloads`: exportar el CSV enriquecido al disco del usuario via browser.downloads.
   - `activeTab`: leer el DOM de la pagina de historial de pedidos de Amazon solo cuando el usuario hace clic en el icono de la extension. No hay host_permissions amplios.
   - `content_scripts.matches`: inyecta el content script en dominios amazon.com/es/co.uk/de/fr/it/com.mx para leer el historial de pedidos via DOM. Son los mismos dominios cubiertos por la funcionalidad declarada.

7. Haz clic en "Submit for review".
8. El tiempo de revision tipico es de 1 a 3 dias habiles.

---

## 2. Mozilla Add-ons (AMO)

### Requisitos previos
- Cuenta en https://addons.mozilla.org/developers/
- Puede requerir 2FA.

### Pasos

1. Ve a https://addons.mozilla.org/developers/addon/submit/
2. Selecciona "Extension" y "On this site" (listado publico).
3. Sube `dist/firefox.zip`.
4. AMO detectara `browser_specific_settings.gecko.id = "amazon-spend-categorizer@extensions"`.

5. En la siguiente pantalla "Describe your add-on":
   - **Name**: Amazon Spend Categorizer
   - **Summary** (hasta 250 chars):
     Categorize your Amazon purchases locally with keyword/ASIN rules. Fiscal flags, CSV export. No data leaves your device.
   - **Description**: igual que en Chrome; usa README.md como base. Incluye al final la misma nota de no afiliacion con Amazon.
   - **Categories**: Appearance > Productivity / Tools & Utilities.
   - **Tags**: amazon, finance, csv, productivity, privacy.
   - **Privacy Policy**: https://gist.github.com/JIZR-DEV/4cf770a87d086a0f8351e4c6e68ba83c
   - **Homepage URL**: https://github.com/JIZR-DEV/amazon-spend-categorizer
   - **Support Email / URL**: (opcional).

6. Screenshots: mismas capturas que en Chrome (1280x800 recomendado).

7. **Seccion critica — Source code upload (requerido por AMO cuando hay build step):**
   - Marca "Yes, I have source code to submit".
   - Sube `dist/source.zip`.
   - En el campo "Notes to reviewer" escribe exactamente:

     ```
     Build instructions (reproducible):
     1. Install Node.js >= 16 (tested with Node 20 LTS).
     2. Run: npm install
     3. Run: node build/build.mjs
     Outputs: dist/chrome/ and dist/firefox/
     The submitted firefox.zip corresponds to dist/firefox/ after the build.
     No bundler or transpiler is used; the build script (build/build.mjs) is a
     plain file-copy step that selects the correct manifest per target.
     All source files in src/ are human-readable, unminified JS/HTML/CSS
     (except lib/papaparse.min.js which is the unmodified upstream distribution
     of PapaParse 5.x, MIT license).
     ```

8. Justificacion de permisos (campo "Notes to reviewer" o durante revision):
   - `storage`: ruleset en storage.local; sync opcional en storage.sync (datos del usuario, no de terceros).
   - `downloads`: exportar CSV via browser.downloads.
   - `activeTab`: leer DOM del historial de pedidos solo al hacer clic. Sin host_permissions amplias.
   - `content_scripts.matches`: dominios de Amazon cubiertos por la funcionalidad declarada.

9. Haz clic en "Submit".
10. El tiempo de revision en AMO varia: puede ser de horas a varios dias. Las extensiones nuevas suelen pasar por revision manual.

---

## Notas generales

### Privacy Policy
El archivo `privacy-policy.md` debe estar disponible en una URL publica antes de enviar a cualquier store. Opciones:
- GitHub Pages: sube el repo y activa Pages; la URL seria algo como `https://tuusuario.github.io/amazon-spend-categorizer/privacy-policy`.
- Cualquier hosting estatico (Netlify, Vercel, etc.).

### Iconos
Iconos reales ya incluidos en `src/icons/` (16/48/128) y en los zips: marca de
etiqueta de precio naranja con franjas de categoria, sin logo de Amazon. Version
512 px para la ficha de la store en `marketing/icon-512.png`. Generador
reproducible: `python marketing/make_icon.py`.

### Capturas de pantalla
Ya generadas (1280x800, listas para subir) en `marketing/screenshots/`:
- `01-categorized.png` — popup con tabla de pedidos categorizada.
- `02-rules.png` — pagina de opciones con el editor de reglas.
- `03-monthly-summary.png` — resumen mensual por categoria.
- `04-import.png` — flujo de importacion de CSV.
- `05-export.png` — exportacion del CSV enriquecido.

Se generan con `node marketing/gen.mjs` (usa datos de muestra, sin marca de Amazon ni datos reales).

### Donaciones
Los enlaces a PayPal/Ko-fi en `donate.html` estan permitidos en ambas stores. Mencionalos en la descripcion del listing ("Support development via the built-in Donate page").

### El envio final es manual
Tanto Chrome Web Store como AMO requieren credenciales de cuenta y, en la mayoria de casos, autenticacion de dos factores (2FA). Este documento guia el proceso pero no puede automatizarlo.
