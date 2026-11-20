---
name: phase2-contract
description: Verify or modify Dao Den Long contract v1.3, fuel and dawn rules, unaffected Phase 2 regressions, deterministic replay evidence and browser performance.
---

Read `docs/notes/phase-3.md`, the fuel/dawn ADR and `CHANGELOG.md` for replacements; `docs/TEST-CONTRACT.md` covers current schema. Keep `src/tuning.mjs` equal to `game.contract.json`; build rejects drift. Standard RGB and accessible replacements live in `web/palette.mjs`.

The fixed simulation counts `tick` even while paused; only active steps increment `simTick`. Inputs persist and action buttons use rising edges. Preserve the 12-stage order in `src/game.mjs`: notably timer decrement precedes movement, drifter theft precedes shade damage, and scheduled entities do not interact until the following step.

Fuel is integer sixtieths, with burn and active drains at stage2 before interaction. Never use one-decimal output for thresholds or ceil refuel. Success only at dawn with ceil(.6*count) currently lit and health>0; no_flames wins precedence. Scenario-lit lamps do not grow capacity. A drain target earns15 total for pulse, not15+5.

Run `node scripts/verify.mjs` after gameplay changes. It executes tests, generates an ordinary-input default-world dawn-survival replay, runs feature scenarios through two separate CLI processes, and compares JSONL bytes. Proof belongs in `docs/proof/phase-4`; never overwrite historical Phase 1/2 evidence or edit generated reports to pass. Do not quietly skip old tests: keep unaffected tests and document replaced expectations in the ADR/changelog.

For visuals/menus, start `node scripts/serve.mjs`, run `node scripts/browser-smoke.mjs`, and inspect generated PNGs. Check low-fuel1Hz brightness, collapsed/torn off lamps in monochrome and saved accessible palette. Browser QA defaults to normal GPU at1280×720; report measured FPS, software fallback and manual/hidden-test limits honestly. Isolated QA canvas scenes are visual fixtures, not manual campaign completions.

Do not change standard tuning to rescue a replay. Improve the controller's ordinary inputs, or report the failed replay. Adding fixtures for isolated features is useful but does not turn a scenario-preconfigured win into a default-world completion.

Phase 4: read docs/notes/phase-4.md. Verify compares all 33 historical Phase 3 JSONL outputs without changes. Run standard bench in a separate visible 1280x720 Chrome, 3s warmup plus requested duration; keep failed baseline and explain optimization. Soak uses same-process resets and actual RSS. Browser smoke must verify 9 bindings/duplicate warning, persistent accessibility, disk score UI/export and text size. Package only source/runtime/docs, never .data/.tools or secrets. Inspect clean extracted package before tagging. Hidden tests and instructor hardware results remain unknown.
