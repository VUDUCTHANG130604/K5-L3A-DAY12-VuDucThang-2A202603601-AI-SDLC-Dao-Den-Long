# Phase 4 — release specification

TICKET-04 is authoritative; gameplay remains Phase3. Node22+ supplies built-in WebSocket. No runtime dependency installation.

| Feature | Acceptance criterion | Evidence |
| --- | --- | --- |
| Benchmark | Seeded Night1,200 wander shades,100 motes,3 lit lamps100fuel; no burn/damage/pickup/spawn/end; ordinary wander; radius30,height15,15s orbit | release.test, bench.json |
| Timing |3s warmup; requested duration; average, slowest ceil1%, nearest-rank p95; process-to-firstGL load | formula tests, benchmark sources |
| Performance | Reference avg≥60,p1≥30,load≤10000; instructor hardware decisive | bench.json; failed baseline retained |
| Soak | Seed7+i,i=0..9; nights1/2/3 cycle same process; direction every30ticks and independent actions; crashes0,RSSratio≤1.2 | soak.json, verify gate |
| Leaderboard | Loss/third-night Dawn form; ASCII3–12; won totals; top10 score-desc/time-asc; ISO timezone; disk persists and export agrees | unit/API restart and concurrent-write tests; browser save/export |
| Keys | All9 remappable, visible duplicate rejection, default restore, saved and mapped action works | unit tests, browser J jump and duplicate W |
| Visual cues | Shade spawn caption/direction, imminent wind, final10s,low fuel, independent of audio | main.mjs HUD; gameplay/fuel screenshots |
| Motion/text | Saved reduced motion, no screen flash/camera shake; text≥18px and large×1.25 | computed-style assertions, accessibility.png |
| Package | Clean extracted ZIP serves without installation; clone/start≤3commands | clean-package.json, README |
| Documentation | Four-phase changelog, credits/license,1–2page retro, actual MP4<5min | linked repository files |
| Compatibility |33 Phase3 fixture JSONL identical;78 tests pass, no skips | verification.json, tests.txt |

Optimization uses ANGLE instancing and reusable per-mesh buffers for gameplay and bench equally. First actual run p1=29.36 failed; after allocation reduction p1=66.64. Failed baseline retained. Measurement is separate from recording. Web RSS is null because aggregate browser-process RSS is not reliably exposed. vsync_off reports Chromium flags, not a driver guarantee.

Soak applies explicit GC at load/reset and1MB V8 semi-space consistently at both measurements. It neither warms before baseline nor retains prior worlds. Random loss is expected, not a crash.

Leaderboard validates local submissions, queues writes and renames atomically; it is not online anti-cheat. Corrupt files show errors instead of silently discarding data. User data/tool binaries are excluded from ZIP.

Limitations: hidden tests unavailable; no independent audio listening/manual full campaign; Linux CI supplied but no observed GitHub run claimed. In-app browser setup failed on missing classic-level.mjs, so standalone Chrome CDP was used. Historical proof remains untouched. No fabricated phase1 tag.
