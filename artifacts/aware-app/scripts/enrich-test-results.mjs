#!/usr/bin/env node
// Adds filmstrip frames + HTTP waterfall timings to all test results
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const srcDataDir = join(__dirname, "..", "src", "data");

function makeFilmstripFrame(id, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"><rect width="240" height="120" fill="#1a1d24"/><text x="12" y="20" fill="#94a3b8" font-family="monospace" font-size="9">${label}</text><text x="12" y="40" fill="#3b82f6" font-family="monospace" font-size="8">id: ${id}</text><rect x="12" y="50" width="216" height="2" fill="#334155"/><text x="12" y="70" fill="#22c55e" font-family="monospace" font-size="8">HTTP 200 OK</text><text x="12" y="85" fill="#94a3b8" font-family="monospace" font-size="7">TTFB: 42ms | Total: 187ms</text><rect x="12" y="95" width="216" height="4" fill="#3b82f6" opacity="0.3"/></svg>`;
  return {
    id: `frame_${id}`,
    label,
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    timestamp: Date.now(),
  };
}

function makeTimings() {
  const dns = Math.round(Math.random() * 30 + 2);
  const tcp = Math.round(Math.random() * 20 + 5);
  const tls = Math.round(Math.random() * 60 + 15);
  const ttfb = Math.round(Math.random() * 80 + 20);
  const download = Math.round(Math.random() * 500 + 50);
  return {
    dnsLookup: dns,
    tcpConnect: tcp,
    tlsHandshake: tls,
    ttfb,
    download,
    total: dns + tcp + tls + ttfb + download,
  };
}

function enrichTestResults(filePath) {
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  let changed = 0;
  for (const [runId, tests] of Object.entries(data)) {
    if (!Array.isArray(tests)) continue;
    for (const test of tests) {
      test.filmstrip = [
        makeFilmstripFrame(test.id, "Page Load"),
        makeFilmstripFrame(`${test.id}_assert`, test.name),
        makeFilmstripFrame(`${test.id}_result`, `${test.status} — ${test.category}`),
      ];
      if (test.evidence?.response) {
        test.evidence.response.timings = makeTimings();
      }
      changed++;
    }
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ ${filePath}: enriched ${changed} tests with filmstrip + timings`);
}

enrichTestResults(join(dataDir, "test-results.json"));
enrichTestResults(join(srcDataDir, "test-results.json"));
