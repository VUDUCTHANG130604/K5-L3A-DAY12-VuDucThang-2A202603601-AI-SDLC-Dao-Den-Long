# Phase 2 — spec, acceptance criteria và nhật ký

Đã nhận đủ TICKET-02 toàn văn từ người dùng, gồm bảng số chuẩn và palette bị mất trong bản dán đầu. Nguồn nằm trong `docs/lab/Phase-2-Contract-v1.1-received.md` và [bổ sung chuẩn](../lab/TICKET-02-standard-addendum.md). Manifest hiện **1.1**. Số tự chọn Phase1 đã thay, không còn blocker thiếu nguồn.

## Acceptance criteria Phần3

| Mục | Tiêu chí | Kiểm chứng |
| --- | --- | --- |
| Gió Lạc | Đêm2/3 spawn1200,2400… max2; idle/chase/flee/removed, speed2/7, ≥5đốm/15m kích hoạt; chạm1.2 cướp min3 đúng1lần; flee240; pulse chase xua, pulse flee trả đồ/120; safe/invuln không chặn cướp | Unit tests + `drifter`, `drifter-drop`, lịch spawn trong test |
| Bùa Gió | Đúng C1/C2/vị trí; nhặt600tick, speed7.2, dash14/12 không cooldown nhưng còn cạnh nút/không ngắt; respawn2700 | Unit + `charm` JSONL |
| Chuỗi3Đêm | Menu→lời Ông Đăng/tên đảo→chơi→kết quả→tiếp; retry giữ Đêm; thắng3 Bình Minh, tổng chỉ Đêm thắng | `campaign.test.mjs`, UI menu/intro/retry trong browser; chưa chơi tay toàn campaign |
| Pause | Esc/P, resume/retry/settings/menu; tick tăng, sim_tick/time/timers/spawn/TTL đứng | Unit + `pause` JSONL + browser tick/sim/time assertions |
| Cài đặt | Volume/sensitivity hoạt động và lưu reload; storage hỏng không làm hỏng game | Unit persistence + browser chỉnh slider/reload |
| Âm thanh | Nhạc theo Đêm, pickup/light/pulse/hit/jump/dash/win/loss/shade-spawn/countdown10s; volume điều chỉnh | Web Audio tổng hợp và browser không lỗi; chưa nghe thử thủ công |
| HUD | Flame trái, mm:ss giữa nhấp nháy đỏ≤30s, đèn/điểm phải;10ô túi dưới giữa; cooldown dưới phải; E x/10; arrow đèn ngoài màn | `gameplay.png`, code và browser assertions; ảnh desktop/hẹp đã xem |
| Palette/ambient | Albedo đúng bảng RGB (0% lệch đầu vào), UI dùng đúng mã; ambient .15+.55×lit/count | `web/palette.mjs`, shader, ảnh; ánh sáng/fog làm pixel cuối biến đổi theo vật lý |

## Bản đồ, gameplay và contract

`src/maps.mjs` dùng tọa độ/bán kính chuẩn cho cả mô phỏng và hình học: Bến40m5đèn, Cau2đảo28m/cầu26..44/pad14–24, Chuông45m/các tầng/dốc30°150°/pad12–8/tháp. 20đốm ban đầu tại điểm khác nhau; sinh mỗi240tick; shade từ300; drifter từ1200. `src/game.mjs` giữ đúng12bước xử lý, mọi counter integer và PRNG seed. `scripts/headless.mjs` xuất JSONL đủ field v1.1 và giữ input persistent/rising edges v1.0.

Chi tiết quyết định cho phần chưa chỉ rõ (spawning, wander, y/tier spawn, timer schema, safe, điểm) tại [TEST-CONTRACT.md](../TEST-CONTRACT.md). Gió báo bằng lá và âm thanh từ warning thực; không thêm event hiệu ứng vào headless.

## Kết quả đo và bằng chứng

42 tests logic/CLI/campaign/map/settings/palette đã đạt. Harness chạy từng fixture qua2process CLI, so từng byte, tạo JSONL thật tại `docs/proof/phase-2`. Full timeout1/2/3 chạy18000/19800/21600tick; thời gian thực mỗi fixture được ghi trong verification.json, thấp hơn30s.

Replay mặc định seed10 thắng Đêm1 ở17034tick, còn3flames,1272điểm. Controller chỉ sinh move/dash/interact/pulse, không sửa state. Các seed/tham số điều khiển thất bại được bỏ đúng nghĩa thử controller, không chỉnh luật game. Harness tái chạy file inputs qua CLI để xác nhận. Fixture win-1/2/3 dùng scenario dựng sẵn các đèn khác sáng để kiểm tra kết thúc từng Đêm, không giả làm full default-world completion.

Chrome normal graphics path Intel Iris Xe / ANGLE D3D11: sample thực1280×720 khoảng52.5FPS, không lỗiJavaScript, menu/intro/move/jump/dash/pause/retry/settings/reload qua kiểm tra. Ảnh map1/2/3 ở canvas QA riêng, chưa chơi tay campaign. Browser report có GPU, sốframe, FPS, thời điểm. Không suy rộng sang mọi GPU.

## Nhật ký AI và harness

Codex đọc ticket thiếu bảng, hỏi bổ sung và chỉ làm map/campaign/settings/audio độc lập. Sau toàn văn: thay số chuẩn, tích hợp physics/timers/spawn/entities/headless, renderer và UI; viết regressions tương ứng số chuẩn. Tests phát hiện shade bị snap độ cao scenario xuống đất: đã giữ offset chiều cao khi di chuyển, để pulse/hit3D đúng. Kiểm tra pad phải xét lần landing đầu; kiểm tra gió phải tới đúng2100 khi hết5s. Thêm default-world replay thay vì chỉ pre-lit fixtures.

Harness gồm AGENTS, repo skill `skills/phase2-contract/SKILL.md`, build/verify/browser scripts và CIUbuntu. Skill tạo theo skill-creator, validator đã chạy. Không có số token/chi phí đo được; không điền giả. Mã, mô hình và audio đều tự sinh trong repo, không asset/CDN ngoài.

Chưa có bộ test ẩn/đánh giá độc lập, chưa nghe âm thanh thủ công hay chơi tay3Đêm, chưa chạy trực tiếp macOS/Linux/GitHubCI trong phiên. Tag/commit được xử lý sau kiểm tra; xem Git thực tế, không xem câu ghi chép này như bằng chứng đã push/public.
