# Changelog

## Phase 4 · v1.0.0 · Contract 1.3

- Standard benchmark and same-process ten-night soak, actual JSON reports.
- ANGLE instancing and reusable buffers: reference p1 improved29.36 to66.64FPS; failed baseline retained.
- Local disk leaderboard with serialized atomic writes, top10, restart persistence and CLI export.
- Nine remappable actions, duplicate detection/default restore, saved reduced motion/large text;18px minimum and visual audio cues.
- ZIP, demo, retro and v1.3 harness. Gameplay JSONL unchanged from Phase3.
- Runtime requirement Node20 to22 for built-in WebSocket harness. Old settings migrate with defaults; tests updated explicitly, none skipped.


## Phase 3 · TICKET-03 · Contract 1.2

Breaking changes:

- Thời lượng Đêm giảm300/330/360 → **240/270/300s**. Bỏ thắng sớm `all_lit`: chỉ xét khi bình minh, phải còn sống và có **3/5,4/6,5/7** đèn sáng. Lý do won là `dawn_survived`; `no_flames` luôn ưu tiên.
- Đèn sáng nhận châm dầu, hao1/s, có thể tắt, mất tiến độ nạp khi hết dầu. Lần đầu10đốm, thắp lại5; nhớ ever_lit và relit_count. Safe6m chỉ khi fuel≥30; shade wander có thể chọn đèn yếu và drain5/s.
- Toàn bộ điểm cũ thay thế: nạp/refuel+5/đốm, lần đầu+100, thắp lại+40, pulse+5/shade hoặc **tổng15** nếu đang drain, dawn thưởng50+floor(fuel) mỗi đèn sáng và50/flame; bỏ thời gian thưởng.
- Túi10+2/successful light, tối đa20; lần thắp lại cũng tăng, scenario-lit không tăng.
- JSONL mỗi lamp thêm fuel/ever_lit/relit_count, player thêm capacity, shade thêm state drain; input scenario thêm fuel/ever_lit/successful_lights/target_lantern_id. Event refuel/lantern_out/fuel_drain, lantern_lit thêm relight. Tuning và manifest lên1.2.
- Cài đặt bổ sung colorblind (mặc địnhfalse, migration từ save cũ), viền/mắt cyan, cảnh báo trắng+⚠; đèn tắt có thân giấy xẹp20% và lỗ rách, không phụ thuộc màu.

Kiểm thử được cập nhật có lý do, không skip:

| Kiểm thử/fixture cũ | Thay đổi và lý do |
| --- | --- |
| `contract v1.1 matches standard tuning`, tiêu đề JSONL1.1 | Chuyển1.2 và số chuẩn mới; tiếp tục kiểm tra toàn bộ manifest/tuning và các field cũ |
| Partial-deposit score40/200 | Thành20/150 theo+5/đốm; giữ nearest/ID/edge/partial assertions |
| `win beats dawn ...` với bonus350 và all_lit | Thay bằng dawn threshold, fuel-floor bonus, no_flames precedence và freeze; thêm trường hợp tất cả đèn sáng nhưng vẫn playing |
| `settings` kỳ vọng object không colorblind | Bổ sung false mặc định, test migration/save/reload true; volume/sensitivity vẫn được kiểm tra |
| Phase2 `win-1/2/3` kết thúc sớm ở tick1 | Fixtures mới sống tới bình minh120tick với đủ ngưỡng; thêm below-threshold và last-tick out/relight |
| Phase2 timeout18000/19800/21600 | Fixtures mới14400/16200/18000 theo thời lượng mới |
| Replay Phase2 seed10 thắng17034tick | Giữ file/bằng chứng cũ ở lịch sử. Replay mới seed12 sống14400tick; controller đổi chiến lược giữ dầu/thắp lại, không sửa luật game |

Các regression movement/jump/dash/pads/ramps/physics, pickup height, pulse3D/stun/push, hit/recoil/fall, drifter/charm, pause/timers, seeded ids và CLI errors được giữ. ADR: [0001](docs/adr/0001-lantern-fuel-and-dawn.md).

## Phase 2 · Contract 1.1

Ba bản đồ chuẩn, dash/pad/tier/wind, Gió Lạc, Bùa Gió, campaign, audio/settings/HUD và deterministic CLI. Bản đã nộp được giữ ở tag `phase-2`, commit `f670baa`.

## Phase 1 · Contract 1.0

Initial Night1 prototype: collection, lantern deposits, pulse, shades, HUD, deterministic CLI and procedural3D. Initial tuning and early victory were standardized/replaced by Phase2–3. No separate phase1 tag exists in the actual history.
