// Renders the app once from the built server and saves it as dist/client/index.html
// so Capacitor can load the app fully offline inside the APK/AAB.
import { writeFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const entry = readdirSync("dist/server").find((f) => /^index\.m?js$/.test(f));
const mod = await import(pathToFileURL(`dist/server/${entry}`).href);
const res = await mod.default.fetch(new Request("http://localhost/?b=470&c=1"), {}, { waitUntil() {}, passThroughOnException() {} });
const html = await res.text();
if (!res.ok || !html.includes("<html")) throw new Error(`Shell render failed: ${res.status}`);
writeFileSync("dist/client/index.html", html);
console.log("✔ dist/client/index.html written");
process.exit(0);
