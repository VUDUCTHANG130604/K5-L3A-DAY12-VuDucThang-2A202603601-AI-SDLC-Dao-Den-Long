# Đảo Đèn Lồng — Phase 3 · Đèn cạn dầu

Game3D WebGL qua **Đảo Bến → Đảo Cau → Đảo Chuông**. Mục tiêu mới là **sống tới bình minh và còn đủ đèn sáng**, thay cho thắng sớm khi thắp hết. Đèn cạn dầu có thể tắt, Bóng Mực hút dầu từ đèn yếu; Mây phải gom đom đóm, châm dầu và thắp lại.

Contract hiện tại **v1.2**; web và headless dùng chung logic60Hz. [ADR đổi stateđèn và luật thắng](docs/adr/0001-lantern-fuel-and-dawn.md), [changelog breaking changes/test migrations](CHANGELOG.md), [spec và acceptance criteria](docs/notes/phase-3.md), [bằng chứng](docs/proof/phase-3/README.md).

![Đèn sáng, tắt và yếu](docs/proof/phase-3/fuel-states-normal.png)

## Chạy game

Cần **Node.js20+**, WebGL và bàn phím. Không cài dependency, không CDN. Hai lệnh từ repo:

```sh
node scripts/build.mjs
node scripts/serve.mjs
```

Mở **http://localhost:3000** → Hành trình mới → Bắt đầu Đêm. Thắng chuyểnĐêm, thua retry cùngĐêm; thắngĐêm3 hiện Bình Minh với tổng điểm cácĐêm thắng. Mất focus tựpause. Chưa có điều khiển cảm ứng.

| Điều khiển | Thao tác |
| --- | --- |
| WASD / mũi tên | Di chuyển theo camera, kể cả trên không |
| Space / Shift | Nhảy / lướt |
| E | Nạp vào đèn tắt hoặc châm dầu đèn sáng gần nhất nhận được |
| F | Tỏa sáng, xua Gió Lạc/choáng và đẩy Bóng Mực |
| Chuột phải kéo / lăn | Xoay camera / zoom |
| Esc / P | Pause: tiếp tục, retry, cài đặt, menu |

Đèn mới cần **10** đốm; đèn từng sáng thắp lại cần **5**. Mỗi lần thắp đặt **100dầu**, hao **1/s**; mỗi đốm châm thêm10, clamp100. Dưới30dầu mất safe6m và nháy1Hz. Bóng Mực wander đến đèn yếu hút5/s/con; pulse chặn chúng. Đèn cạn tắt và mất tiến độ nạp, nhưng nhớ từng sáng. Túi tăng **10→20**, thêm2 mỗi lần thắp thành công, cả thắp lại; không tăng do refuel.

Thời lượng **240/270/300s**. Bình minh phải còn sống và có **3/5 · 4/6 · 5/7** đèn sáng. Hết Ngọn Lửa luôn thua, kể cả tick cuối. Các cơ chế chuẩn Phase2 (chạy6, dash14/0.2s/1.5s, nhảy7/gravity−20, cầu/pad/tầng, Gió Lạc, Bùa Gió, rơi đảo) được giữ.

Trong Cài đặt, bật **Bảng màu dễ phân biệt**: viền/mắt shadecyan, cảnh báo trắng+⚠. Đèn tắt thân giấy xẹp20% và rách nên phân biệt được trong grayscale. Volume, sensitivity và lựa chọn màu được lưu qua lần mở lại; save cũ mặc định mùmàufalse.

## Điểm v1.2

Nạp/thắp lại/refuel **+5/đốm**, thắp đầu **+100**, thắp lại **+40**. Pulse **+5/shade**, hoặc **tổng+15** nếu nó đang hút dầu. Khi thắng bình minh: mỗi đèn còn sáng **+50+floor(dầu)**, mỗi Ngọn Lửa **+50**. **Bỏ thưởng thời gian**. Chỉ điểm các Đêm thắng vào tổng, retry không cộng lặp.

## Kiểm chứng và headless

```sh
node scripts/headless.mjs --seed 12 --night 1 --inputs tests/scenarios/phase3-win.inputs.json --ticks 14400 --out dawn.jsonl
```

Replay này từ thế giới mặc định, chỉ input thông thường: sống14400tick, **3đèn/2NgọnLửa/1102điểm**. Không chỉnh fuel/time/health để thắng. Xem [game.contract.json](game.contract.json) và [schema/semantics](docs/TEST-CONTRACT.md). CLI nhậnnight1/2/3, scenario, inputs, snapshot-every; khôngGPU/mạng/cửa sổ; hợp lệ exit0 kể cả thua, schema sai2, lỗi vận hành1.

**`node scripts/verify.mjs`** chạy unit/regression, tạo replay mới, chạy mỗi fixture qua2processCLI so từngbyte JSONL, fulltimeout3Đêm và campaign từ kết quả CLI. Output hiện tại ở `docs/proof/phase-3`; không ghi đè proofPhase1/2. Không skip âm thầm test sai; lý do thay kỳ vọng nằm trong changelog.

BrowserQA: mở server rồi **`node scripts/browser-smoke.mjs`** (Node22+, Chrome/Chromium; có thể thêm đường dẫn executable). Chạy GPU thường1280×720, đoFPS thật, kiểm tra pause/tick, settings/reload, pixelnháy1Hz, ảnh fuelstates/grayscale. Giá trịGPU/FPS/time nằm trong `browser.json`; không suy ra hiệu năng mọi máy. `QA_SOFTWARE=1` chỉ là fallback có gắn nhãn.

## Sáng tạo của tôi và giới hạn

Giữ Mây đội nón lá treo đèn, tay chân chuyển động, nan đèn, cảnh vật procedural, shadowmap/ánh sáng cục bộ, lá báo gió và WebAudio tổng hợp. Hình ảnh điều chỉnh theo luật dầu, giấy rách/xẹp và blink; hiệu ứng và chế độ màu không đổi headless. Bản đồ chuẩn3Đêm, audio/settings và camera vẫn được giữ.

Harness: [AGENTS.md](AGENTS.md), [skill kiểm chứng](skills/phase2-contract/SKILL.md), scripts/tests và CIUbuntu. Tài liệu/code/bằng chứngPhase2 giữ ở tag `phase-2`; Phase3 dùng commit/tag riêng. [Nguồn](CREDITS.md), [giấy phép mã mới](LICENSE).

Đã kiểm tra Windows/Chrome; chưa có bộ chấmẩnPhase1–3, đánh giá độc lập/nghe thử audio/fullcampaign chơi tay hoặc chạy trực tiếp macOS/Linux. Fixturespre-lit và canvasQA được ghi rõ, không giả thành hoàn thành mặc định. Kết quả CI chỉ xác nhận khi có runGitHub thực tế.
