#!/usr/bin/env bash
# Builds the single file you upload to WHC.ca:  dist/cooking-courses/index.html
#
#   API_BASE=https://mcuire-kitchen.onrender.com tools/build-page.sh
#
# API_BASE = the address of the background server (Render). Leave it out to
# build the self-contained demo (test mode, everything stored in the browser).
# WP=1 builds the page for the WordPress plugin (wordpress-plugin/.../app/app.html).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=dist/cooking-courses
mkdir -p "$OUT" wordpress-plugin/mcuire-cooking-courses/app
npx -y esbuild@0.24.0 assets/js/app.js --bundle --format=iife --minify --target=es2020 --outfile=dist/bundle.js --log-level=warning
API_BASE="${API_BASE:-}" node --input-type=module -e '
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const api = process.env.API_BASE.replace(/\/$/, "");
const wp = process.env.WP === "1";
const cfg = api ? { dataSource: "api", payments: "stripe", apiBase: api } : { dataSource: "local", payments: "demo" };
// WordPress plugin build: the plugin fills in the config when it serves the page.
const cfgText = wp ? "__MCUIRE_CONFIG__" : JSON.stringify(cfg);
let html = readFileSync("index.html", "utf8");
// The demo page is a single file, so it carries the plugin photos inline.
// The WordPress page loads them from the plugin media/ folder instead.
const mdir = "wordpress-plugin/mcuire-cooking-courses/media/";
const types = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const media = wp ? "" : "<script>window.MCUIRE_MEDIA = " + JSON.stringify(Object.fromEntries(readdirSync(mdir).filter((f) => types[f.split(".").pop()])
  .map((f) => [f, "data:" + types[f.split(".").pop()] + ";base64," + readFileSync(mdir + f).toString("base64")]))) + ";</script>\n";
// Function replacers: the bundle contains "$&"-style sequences that string replacers would mangle.
const css = readFileSync("assets/css/mcuire.css", "utf8");
const js = readFileSync("dist/bundle.js", "utf8").replaceAll("</script", "<\\/script");
html = html.replace("<link rel=\"stylesheet\" href=\"assets/css/mcuire.css\">", () => "<style>\n" + css + "\n</style>");
html = html.replace("<script type=\"module\" src=\"assets/js/app.js\"></script>",
  () => "<script>window.MCUIRE_CONFIG = " + cfgText + ";</script>\n" + media + "<script>\n" + js + "\n</script>");
if (html.includes("assets/js/app.js")) throw new Error("bundle not inlined");
const out = wp ? "wordpress-plugin/mcuire-cooking-courses/app/app.html" : "'"$OUT"'/index.html";
writeFileSync(out, html);
console.log("Built", out, wp ? "(WordPress plugin)" : api ? "(server: " + api + ")" : "(demo mode)");
'
rm -f dist/bundle.js
# The plugin seeds its database from the same content as the app.
if [ "${WP:-}" = "1" ]; then
  node --input-type=module -e '
import { writeFileSync } from "node:fs";
const { SEED } = await import(process.cwd() + "/assets/js/data/seed.js");
writeFileSync("wordpress-plugin/mcuire-cooking-courses/data/seed.json", JSON.stringify(SEED));
console.log("Wrote seed.json: version", SEED.version, "·", SEED.courses.length, "courses ·", SEED.liveClasses.length, "live classes");
'
fi
