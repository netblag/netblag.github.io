import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The whole website lives in a single self-contained file: `public/index.html`.
 * It is delivered verbatim at "/" (and is also reachable at "/index.html"),
 * so the exact same file can be dropped on GitHub Pages without any changes.
 */
export const runtime = "nodejs";
export const dynamic = "force-static";

let cached: string | null = null;

async function loadHtml(): Promise<string> {
  if (cached) return cached;
  cached = await readFile(path.join(process.cwd(), "public", "index.html"), "utf8");
  return cached;
}

export async function GET() {
  const html = await loadHtml();
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
