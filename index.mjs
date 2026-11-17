#!/usr/bin/env node
// headers-scan — grade a domain's HTTP security headers.
// Usage: npx headers-scan <url> [--json] [--min-grade B]

const HEADERS = [
  {
    key: "strict-transport-security",
    name: "Strict-Transport-Security",
    weight: 20,
    hint: 'add "max-age=31536000; includeSubDomains"',
  },
  {
    key: "content-security-policy",
    name: "Content-Security-Policy",
    weight: 30,
    hint: "start with Report-Only, then tighten sources",
  },
  {
    key: "x-frame-options",
    name: "X-Frame-Options / frame-ancestors",
    weight: 15,
    hint: 'DENY or SAMEORIGIN (or CSP "frame-ancestors")',
    alt: (h) => (h["content-security-policy"] || "").includes("frame-ancestors"),
  },
  {
    key: "x-content-type-options",
    name: "X-Content-Type-Options",
    weight: 10,
    hint: 'set "nosniff"',
  },
  {
    key: "referrer-policy",
    name: "Referrer-Policy",
    weight: 10,
    hint: '"strict-origin-when-cross-origin" is a sane default',
  },
  {
    key: "permissions-policy",
    name: "Permissions-Policy",
    weight: 10,
    hint: 'e.g. "camera=(), microphone=(), geolocation=()"',
  },
];

const GRADES = [
  [95, "A+"], [85, "A"], [75, "B+"], [65, "B"],
  [55, "C"], [45, "D"], [0, "F"],
];

function grade(score) {
  for (const [min, g] of GRADES) if (score >= min) return g;
  return "F";
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes("--json");
  const minIdx = args.indexOf("--min-grade");
  const minGrade = minIdx > -1 ? args[minIdx + 1]?.toUpperCase() : null;
  const target = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--min-grade");

  if (!target) {
    console.error("Usage: headers-scan <url> [--json] [--min-grade B]");
    process.exit(2);
  }

  const url = target.startsWith("http") ? target : `https://${target}`;
  let res;
  try {
    res = await fetch(url, { method: "HEAD", redirect: "follow" });
  } catch (e) {
    console.error(`Fetch failed: ${e.message}`);
    process.exit(2);
  }

  const headers = {};
  for (const [k, v] of res.headers) headers[k.toLowerCase()] = v;

  let score = 0;
  const results = HEADERS.map((h) => {
    const present = headers[h.key] !== undefined || (h.alt ? h.alt(headers) : false);
    if (present) score += h.weight;
    return { header: h.name, present, weight: h.weight, hint: present ? null : h.hint, value: headers[h.key] ?? null };
  });

  const g = grade(score);

  if (jsonOut) {
    console.log(JSON.stringify({ url: res.url, score, grade: g, results }, null, 2));
  } else {
    console.log(`\n  ${res.url}\n`);
    for (const r of results) {
      const mark = r.present ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
      console.log(`  ${mark} ${r.header}${r.present ? "" : `  — ${r.hint}`}`);
    }
    console.log(`\n  Score: ${score}/100  Grade: ${g}\n`);
  }

  if (minGrade) {
    const order = ["F", "D", "C", "B", "B+", "A", "A+"];
    if (order.indexOf(g) < order.indexOf(minGrade)) process.exit(1);
  }
}

main();
