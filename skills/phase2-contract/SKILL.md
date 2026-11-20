---
name: phase2-contract
description: Verify or modify Dao Den Long Phase 2 gameplay, JSONL contract v1.1, replay evidence and browser performance. Use for simulation or acceptance changes in this repository.
---

Read `docs/notes/phase-2.md` for the ticket's acceptance criteria and `docs/TEST-CONTRACT.md` for schema decisions. Keep `src/tuning.mjs` equal to `game.contract.json`; build rejects drift. Standard RGB albedos live in `web/palette.mjs`.

The fixed simulation counts `tick` even while paused; only active steps increment `simTick`. Inputs persist and action buttons use rising edges. Preserve the 12-stage order in `src/game.mjs`: notably timer decrement precedes movement, drifter theft precedes shade damage, and scheduled entities do not interact until the following step.

Run `node scripts/verify.mjs` after gameplay changes. It executes tests, generates an ordinary-input default-world winning replay, runs feature scenarios through two separate CLI processes, and compares JSONL bytes. Proof belongs in `docs/proof/phase-2`; never overwrite historical Phase 1 evidence or edit generated reports to pass.

For visuals/menus, start `node scripts/serve.mjs`, run `node scripts/browser-smoke.mjs`, and inspect generated PNGs. Browser QA defaults to the normal GPU path at 1280×720. Its measured FPS must meet 30; software mode is a fallback and must be identified. A map rendered in an isolated QA canvas does not establish a manually completed campaign. Record unperformed manual audio, hidden tests and cross-platform checks honestly.

Do not change standard tuning to rescue a replay. Improve the controller's ordinary inputs, or report the failed replay. Adding fixtures for isolated features is useful but does not turn a scenario-preconfigured win into a default-world completion.
