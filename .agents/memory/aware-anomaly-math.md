---
name: AWARE anomaly math constraints
description: Mathematical constraints on Z-score thresholds for anomaly test design and IQR/ZScore interaction.
---

## Z-score for a single outlier

For `n` data points where `n-1` are identical and 1 is an extreme outlier:

```
Z_outlier = sqrt(n - 1)
```

Thresholds for test data design:
- Z > 2 (pass-rate-drop flag): needs n ≥ 6 (5 healthy + 1 bad)
- Z > 3 (critical-pass-rate-drop flag): needs n ≥ 11 (10 healthy + 1 bad)

**Why:** This is a fundamental result from the sample variance formula. The false-pass conditional assertions in the original anomaly.test.ts (`if (badRun.passRateZ > 2) { expect... }`) never fired because the 5-run dataset produces Z_max = sqrt(4) = 2.0 exactly — not > 2.

## IQR vs Z-Score design

The anomaly/iqr.ts uses two different methods for two different purposes:
- **Detection**: IQR fence (robust to outliers) — decides IF an anomaly exists
- **Severity**: `excessRatio = (latest - upperLimit) / iqr` — IQR-relative, scale-free
- **zScore field**: stddev-based, retained for AnomalyResult interface compatibility

**How to apply:** When writing IQR tests, assert the severity using the excessRatio logic (> 2 = critical, > 1 = high, else medium), not raw z-score thresholds.
