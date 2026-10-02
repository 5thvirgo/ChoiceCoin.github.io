#!/usr/bin/env bash
# Builds the single file you upload to WHC.ca:  dist/cooking-courses/index.html
#
#   API_BASE=https://mcuire-kitchen.onrender.com tools/build-page.sh
#
# API_BASE = the address of the background server (Render). Leave it out to
# build the self-contained demo (test mode, everything stored in the browser).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=dist/cooking-courses
mkdir -p "$OUT"
npx -y esbuild@0.24.0 assets/js/app.js --bundle --format=iife --minify --target=es2020 --outfile=dist/bundle.js --log-level=warning
API_BASE="${API_BASE:-}" node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const api = process.env.API_BASE.replace(/\/$/, "");
const cfg = api ? { dataSource: "api", payments: "stripe", apiBase: api } : { dataSource: "local", payments: "demo" };
let html = readFileSync("index.html", "utf8");
// Function replacers: the bundle contains "$&"-style sequences that string replacers would mangle.
const css = readFileSync("assets/css/mcuire.css", "utf8");
const js = readFileSync("dist/bundle.js", "utf8").replaceAll("</script", "<\\/script");
html = html.replace("<link rel=\"stylesheet\" href=\"assets/css/mcuire.css\">", () => "<style>\n" + css + "\n</style>");
html = html.replace("<script type=\"module\" src=\"assets/js/app.js\"></script>",
  () => "<script>window.MCUIRE_CONFIG = " + JSON.stringify(cfg) + ";</script>\n<script>\n" + js + "\n</script>");
if (html.includes("assets/js/app.js")) throw new Error("bundle not inlined");
writeFileSync("'"$OUT"'/index.html", html);
console.log("Built '"$OUT"'/index.html", api ? "(server: " + api + ")" : "(demo mode)");
'
rm -f dist/bundle.js
