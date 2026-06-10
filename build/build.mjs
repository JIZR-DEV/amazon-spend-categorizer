// build.mjs — genera dist/chrome y dist/firefox desde src/
// Uso: node build/build.mjs
// Requiere Node.js >= 16

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");

// Archivos y directorios compartidos (copiados a ambos targets)
const SHARED = [
  "browser-polyfill.js",
  "i18n.js",
  "background.js",
  "content-script.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "options.html",
  "options.js",
  "options.css",
  "welcome.html",
  "welcome.js",
  "update.html",
  "update.js",
  "donate.html",
  "donate.css",
  "icons",
  "_locales",
  "lib"
];

const TARGETS = [
  { name: "chrome", manifest: "manifest.chrome.json" },
  { name: "firefox", manifest: "manifest.firefox.json" }
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

for (const target of TARGETS) {
  const destDir = path.join(DIST, target.name);
  rmrf(destDir);
  fs.mkdirSync(destDir, { recursive: true });

  // Copia archivos compartidos
  for (const item of SHARED) {
    const srcPath = path.join(SRC, item);
    const destPath = path.join(destDir, item);
    if (fs.existsSync(srcPath)) {
      copyRecursive(srcPath, destPath);
    } else {
      console.warn(`[build] WARNING: ${srcPath} not found, skipping.`);
    }
  }

  // Copia el manifest correspondiente como manifest.json
  const manifestSrc = path.join(SRC, target.manifest);
  const manifestDest = path.join(destDir, "manifest.json");
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log(`[build] ${target.name}: manifest.json <- ${target.manifest}`);
  } else {
    console.error(`[build] ERROR: ${manifestSrc} not found!`);
    process.exit(1);
  }

  console.log(`[build] dist/${target.name}/ ready.`);
}

console.log("[build] Done. Load dist/chrome or dist/firefox in your browser.");
