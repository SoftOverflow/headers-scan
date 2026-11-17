# headers-scan

Scan a domain's HTTP security headers and grade it — like securityheaders.com, but from your terminal or CI.

```bash
node index.mjs softoverflow.com
```

```
  https://softoverflow.com

  ✓ Strict-Transport-Security
  ✓ Content-Security-Policy
  ✓ X-Frame-Options / frame-ancestors
  ✓ X-Content-Type-Options
  ✓ Referrer-Policy
  ✗ Permissions-Policy  — e.g. "camera=(), microphone=(), geolocation=()"

  Score: 90/100  Grade: A
```

## Options

| Flag | Effect |
|---|---|
| `--json` | machine-readable output |
| `--min-grade B` | exit code 1 if the grade is below (CI gate) |

```bash
# In CI — fail the pipeline if headers regress
node index.mjs example.com --min-grade B
```

## What's checked

- `Strict-Transport-Security` (20 pts)
- `Content-Security-Policy` (30 pts) — `frame-ancestors` counts for clickjacking
- `X-Frame-Options` (15 pts)
- `X-Content-Type-Options` (10 pts)
- `Referrer-Policy` (10 pts)
- `Permissions-Policy` (10 pts)
- No tech disclosure (`X-Powered-By`, `X-Generator`…) (5 pts)

Zero dependencies. Node 18+.

Made by [SoftOverflow](https://www.softoverflow.com) — we audit this stuff for a living.
