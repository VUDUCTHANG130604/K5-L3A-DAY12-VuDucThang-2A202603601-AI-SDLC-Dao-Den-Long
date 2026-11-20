# Phase 3 — Đèn cạn dầu · spec và kiểm chứng

Yêu cầu: [TICKET-03](../lab/TICKET-03.md), contract1.2. Quyết định: [ADR-0001](../adr/0001-lantern-fuel-and-dawn.md). Breaking changes và bảng test sửa có lý do: [CHANGELOG](../../CHANGELOG.md).

| Mục | Acceptance criteria | Kiểm chứng |
| --- | --- | --- |
| Dầu/expiry | 100fuel=6000units, trừ1/tick, đúng6000active tick tắt1lần, deposited0, ever_lit giữ | `fuel.test.mjs`, `fuel-expiry` JSONL |
| Refuel | E chọn receiver gần nhất/ID, ceil rawunits, clamp100, used0 không event/điểm, điểm5/used | Unit, `refuel`, helper-full và timer-before-interact tests |
| Relight/capacity | Ever-lit cost5, partial deposit, relit_count tăng, mỗi success+2cap max20; scenario không cộng | Unit, `relight`, `relight-cycle` (2lần tắt,3lần thắp thật), dynamic HUD |
| Safe/drain | Exact30 safe, dưới30 không safe; chỉwander chọnweak gần nhất; drain≤2,5/s mỗi shade; chase6, out/refuel/away→wander | Unit, `drain-stack`, `safe-restore`; log per60active drain ticks |
| Pulse | Drain nhận15 tổng, normal/stunned5; stun/push3D giữ chuẩn; hết stun→wander | `drain-pulse`, unit/regressions |
| Bình minh | 240/270/300s, không sớm; ≥3/5,4/6,5/7 khi còn sống; no_flames ưu tiên; cuối tick out/relight được tính | `no-early-win`, timeout3Đêm, win/below-threshold3Đêm, `dawn-extinguish`, `dawn-final-relight` và unit |
| Điểm | +5 nạp/refuel,+100first,+40relight,+5/15pulse, dawnlit50+floor(rawfuel), flames50, không thưởng thời gian | Unit, CLI scoring fixtures, campaign JSON |
| Pause | Fuel/drain cadence cùng timers/TTL/spawn freeze, tick vẫn tăng | `fuel-pause`, giữ pause regressions |
| Mù màu | Setting bool lưu qua reload, migratefalse; cyanrim/eyes, warningwhite+⚠; unlit giấy×.8 và rách, low1Hz | Settings/paletteunit, browserreload, ảnh normal/accessible/grayscale, readPixels1Hz |
| Giữ phần cũ | Tọa độ/map, movement/jump/dash/pads/ramps, hit/fall, pickupheight, drifter/charm, seededCLI không đổi | Các regressionPhase2 giữ nguyên trừ kỳ vọng bị CR thay, không skip |

Fuel được tính ở bước2 trước tương tác; rawfuel30.0 vẫn an toàn nhưng sau một tick sẽ thấp hơn30 nếu không châm. Snapshot30.0 có thể là raw29.983…; không dùng output đã round cho logic. Đèn full đầu tick có thể nhận1 sau burn. Chi tiết edge/order/cadence trong ADR.

## Kết quả và giới hạn

Replay Đêm1 mặc định seed12 sống tới tick14400, có3/5lit,2flames,1102điểm. Controller chỉ dùng move/dash/interact/pulse. Chiến lược chuẩn bị rồi thắp lại muộn là hợp lệ vì ticket chỉ xét ngưỡng cuối Đêm; không sửa fuel, time, entities hoặc tuning để thắng. Các thử controller trước không đủ3đèn bị báo thua đúng và không được dùng làm proof thắng.

Harness `node scripts/verify.mjs`: tests không skip, sinh replay mới, chạy từng fixture2processCLI và so byte; bằng chứng ở `docs/proof/phase-3`. Fixtureswin3Đêm dùng scenario ngắn để kiểm tra verdict, không giả làm full campaign default. Campaign/retry dùng điểm kết thúc CLI thật, không đổi cơ chế tổng điểm.

Browser dùng GPU thường1280×720, kiểm tra menu/input/pause/settings/mùmàu/reload, renderbar/shape và đo pixel nhấp nháy1Hz. Ảnh QA ba đèn75/0/20fuel là fixture hình ảnh, không state của màn chơi người dùng. Đã xem ảnh grayscale: đèn tắt xẹp/rách, lit có bar riêng. Mọi thời điểm/GPU/FPS thực trong browser.json; không suy rộng sang mọi máy.

Chưa có bộ chấm ẩnPhase1–3, nghe audio/đánh giá độc lập hay chơi thủ công toàn bộ3Đêm; chưa chạy trực tiếp macOS/Linux hoặc xác nhận GitHubCI. Repo có workflowUbuntu. Giữ nguyên bằng chứngPhase1/2 và tagphase-2; phase3 tạo commit/tag riêng sau các checks.

## Nhật ký AI

Codex đọc CR, tách lantern logic, integerfuel, chỉnh AI/score/dawn, mở rộng HUD/cài đặt/render; chạy oldtests để xác định đúng kỳ vọng bị thay, sửa4nhóm tương ứng thay vìskip. Mở rộng testscho boundary30/fullceil/expiry/finaltick/stackeddrain/pause/capacity. Replay controller cũ không thể áp dụng, đã thay bằng chiến lược bảo toàn dầu/thắp lại, không chỉnh thông sốgame. Cập nhật skill/harness vàADR/changelog. Không có số token/chi phí đo được; không điền giả.
