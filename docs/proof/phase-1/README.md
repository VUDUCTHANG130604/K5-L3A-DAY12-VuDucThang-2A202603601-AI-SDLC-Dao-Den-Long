# Bằng chứng Phase 1 · Contract v1.0

Nguồn yêu cầu: [PRD-0 / Test Contract v1.0](../../lab/PRD-0-Test-Contract-v1.0.md). Không phải bằng chứng bộ test ẩn của giảng viên.

Tạo lại: `node scripts/verify.mjs`. Ảnh/báo cáo browser: chạy server rồi `node scripts/browser-smoke.mjs`.

| Kiểm chứng | Bằng chứng | Kết quả |
| --- | --- | --- |
| Manifest tuning = gameplay; persistent input/camera, chuẩn hóa, nhảy | `tests.txt` | Đạt |
| Bán kính/capacity, nạp từng phần/cạnh nút, 5 đèn | `tests.txt` | Đạt |
| Chase, pulse/cost/push/stun/cooldown, hit/drop/invulnerability/safe | `tests.txt` | Đạt |
| Scenario override/reset, tick 0, k+1, score, end/freeze | `tests.txt` | Đạt |
| CLI cờ chuẩn, JSONL, format error exit 2 | `tests.txt` | Đạt |
| Replay thế giới mặc định chỉ input thường, không teleport | `win.output.jsonl`, `tests/scenarios/win.inputs.json` | Won tick 2633, 5 đèn, 3 tim, 1652 điểm |
| Bình minh, scenario tắt shade | `timeout.output.jsonl` | Lost/dawn đúng tick 18000 |
| Tất định qua 2 lần CLI riêng, byte-for-byte | `verification.json`, `walk.output.jsonl`, `timeout.output.jsonl`, `win.output.jsonl` | Đạt |
| Render/shadow, di chuyển, nhảy, pause/resume/reset | `browser.json` | Đạt Chrome headless / SwiftShader |
| Desktop/hẹp, mô hình và ánh sáng | `intro.png`, `gameplay.png`, `narrow-layout.png` | Screenshot game thật, đã xem ảnh |
| Cảnh sau replay thắng (canvas QA riêng, không HUD chơi thật) | `lanterns-lit.png` | Render state won của replay mặc định |
| macOS/Linux, CI từ GitHub, chơi tay/đánh giá độc lập/video | Chưa có | Chưa thực hiện |
| Bộ chấm ẩn | Chưa có | Chưa chạy |

`*.scenario.json`/`*.inputs.json` cạnh mỗi output là đầu vào thực được harness dùng. Mỗi output tái tạo bằng `node scripts/headless.mjs --seed 12 --night 1 --scenario <name>.scenario.json --inputs <name>.inputs.json --ticks 18000 --out result.jsonl` (walk dùng 120 ticks). Không sửa output hoặc ảnh bằng tay. Thời điểm/runtime/nền tảng nằm trong báo cáo được sinh bởi lệnh.
