# Test Contract v1.1 — triển khai

Nguồn: PRD-0 v1.0, bản ticket Phase2 ban đầu và [bảng chuẩn toàn văn được bổ sung](lab/TICKET-02-standard-addendum.md). Tuning chính xác tại `game.contract.json`, build so với `src/tuning.mjs` bằng deep equality.

CLI từ gốc repo: `node scripts/headless.mjs --seed 12 --night 2 --scenario scenario.json --inputs inputs.json --ticks 19800 --out result.jsonl --snapshot-every 10`. Node20+, không GPU. Exit0 hợp lệ, exit2 JSON/schema sai, exit1 cờ/file/I/O sai. Các đầu vào v1.0 (motes dạng `[x,y,z]`, player.pos/carried/flames, lanterns cập nhật theo id, random_motes/shades) vẫn được nhận với tuning chuẩn mới.

## Snapshot và input

Snapshot0 sau dựng scenario, trước input; dựng không điểm/event. `step` k đọc frame tick k, ghi event tick k+1. `tick` luôn tăng ở mọi bước không terminal, `sim_tick` chỉ tăng khi active. Khi pause state=paused, timer/TTL/spawn/vận tốc gameplay đứng yên; `pause` rising edge đổi trạng thái. Resume thực hiện bước gameplay ngay tick resume theo thứ tự ticket. Input persistent, move mặc định[0,0], yaw0, jump/dash/interact/pulse/pause false; frame.tick tăng nghiêm ngặt. Hướng xoay camera đúng công thức v1.0.

Snapshot mỗi N tick bắt đầu0, thêm snapshot cuối nếu nằm giữa mốc, sau cùng bắt buộc end. `state` playing/paused/won/lost. Vị trí và vel làm tròn3 chữ số, `-0` thành0. Root thêm night, wind{active,dir_deg}; player có pos, vel, grounded, flames, carried, invuln(boolean), dash_cd_s, pulse_cd_s, charm_s. Lanterns đủ5/6/7 đèn. Shades dùng đúng spawning/wander/chase/recoil/stunned. Motes bắt buộc gồm id,pos,kind,ttl_s: random ttl_s=null, dropped là số giây còn lại. Drifters có id,pos,state,stolen, giữ removed trong output để tham chiếu ID. Charms có id,available,respawn_s.

`time_left_s=max(0,scenario.time_left_s−sim_tick/60)`; mặc định thời lượng300/330/360. Không chạy sau terminal. `night_start` phát ở bước gameplay đầu tiên, không phát khi dựng scenario hoặc đứng paused từ đầu. Không thêm event âm thanh/hiệu ứng vào JSONL.

## Scenario v1.1

- `player` nhận pos/carried/flames và invuln_ticks/dash_cd_ticks/pulse_cd_ticks/charm_ticks (integer≥0). Trạng thái grounded suy từ mặt đất dưới chân; mặc định vel0/facing+Z.
- `shades` thay danh sách; mỗi phần tử có pos, id tùy chọn, state (mặc định chase), state_ticks_left. Stunned/recoil dùng thời gian đó; scenario bình thường có thể tương tác ngay bước1.
- `drifters` thay danh sách; pos, id tùy chọn, state idle/chase/flee/removed, stolen≥0, state_ticks_left. Flee mặc định240tick, hướng ra xa Mây khi dựng.
- `charms` thay danh sách; id, pos (có thể bỏ khi id trùng bùa mặc định), available, respawn_ticks hoặc respawn_s. Unavailable không chỉ định timer mặc định45s. Vị trí có trong state nội bộ để nhặt/render; snapshot tuân thủ trường contract yêu cầu.
- `motes` hỗ trợ dạng v1.0, hoặc `{id?,pos,kind?,ttl_s?}` để test TTL. Không cho điểm khi dựng; dropped mặc định8s.
- Các cờ random_motes/random_shades/random_drifters false tắt cả khởi tạo và lịch spawn tương ứng, chỉ giữ thực thể liệt kê. Danh sách tường minh thay danh sách đầu nhưng lịch còn chạy nếu không tắt cờ. wind_enabled false tắt gió.
- Lanterns cập nhật theo L1…Ln, đèn không nhắc giữ nguyên. lit:true đặt deposited10; deposited10 cũng làm sáng. Schema sai/ID trùng/ID đèn lạ bị từ chối.

## Thứ tự và mốc thời gian

Theo đúng12 bước ticket: pause → timers → move/jump/dash/pad/wind/fall → pickup/charm → deposit → safe → pulse → move enemies → theft rồi hits theo ID → scheduled spawns → terminal → output. Mỗi timer dùng integer tick, giảm ở đầu bước trước hành động. Hiệu lực mới được đặt đủ số tick tại hành động; snapshot cùng tick thấy giá trị đầy đủ. Dash chạy đúng12 bước, cooldown bắt đầu90 tại kích hoạt; charm bỏ cooldown nhưng vẫn yêu cầu cạnh mới và không ngắt dash.

Pulse khóa target bằng khoảng cách3D chân+0.8 tới tâm shade, stun120, push4m trong15 bước gồm bước kích hoạt. Recoil2m/60 bước sau hit. Thực thể scheduled được dựng ở cuối bước nên chỉ tương tác từ bước sau. Drop hit/theft cũng xuất hiện sau pickup nên không nhặt được cùng tick; TTL giảm từ bước sau. Fall chỉ hit một lần, p.respawnTicks ngăn pickup/contact trong60tick, không tạo đốm rơi từ số lost.

## Các quyết định ticket chưa quy định chi tiết

- Chạy/dừng tức thời (nằm trong ≤0.1s). Jump tích phân semi-implicit Euler ở60Hz. Pad giữ velocity ngang riêng đến landing; dash tạm ghi đè rồi trả lại velocity pad; air dash giữ cả độ cao và vy trong12tick.
- Spawn shade: bảng chuẩn chung hai con tick300 áp dụng cả3 Đêm, sau đó mỗi480/420/360tick. Scheduled spawning chỉ chiếm trạng thái tại tick sinh, tick sau có thể wander/chase. Wander dùng tốc độ chuẩn, heading tất định theo seed; phát hiện/bỏ đuổi XZ12/18. Không tìm đường toàn bản đồ; cản địa hình chặn bước đi. Không hồi sinh shade bị pulse vì chúng không chết.
- Safe eject tuyến tính ra mép trong30 bước; không hit khi eject. Người chơi trong vùng sáng được bảo vệ khỏi shade; Gió Lạc bỏ qua safe/invuln. Safe tínhXZ theo contract. E tương tác cũng theoXZ, không thêm ngưỡng cao ngoài ticket.
- Đom đóm dropped rải vành bằng PRNG seed, TTL8s, không bật điểm khi nhặt. Drifter trả đồ tại XZ của nó, Y là mặt đất (center−0.8), TTL8s, không rải vành.
- Gió Lạc spawn dùng điểm sương/shadePoints; idle bay2m/s, chase/flee7; flee tự giữ hướng rời Mây, có thể bay khỏi đảo. Pulse idle không đổi trạng thái; pulse chase flee rỗng; pulse flee có đồ trả hết rồi đếm120.
- Gió hướng độ từ+X về+Z; báo trước tại sim_tick1680+1800k, gió tại1800+1800k trong300bước. PRNG chọn hướng lúc báo để lá và âm thanh khớp.
- Night3 vẫn xuất phát chân(0,0,0) theo contract nền; tầng cao chặn khi đi từ ngoài lên, không dịch chuyển spawn tự động. Renderer hiển thị Mây xuyên phần tầng che để không mất dấu khi ở dưới tầng giữa. Không thay tọa độ headless vì hình ảnh.
- Điểm theo số đốm nạp, không nhặt; thưởng kết thúc chỉ won. no_flames ưu tiên all_lit, rồi dawn, đúng ticket. Campaign ngoài mô phỏng headless1Đêm, chỉ cộng các Đêm thắng và retry không cộng lặp.

Bộ test ẩn không có trong repo. Không coi fixture pre-lit hoặc ảnh canvas QA là bằng chứng người chơi đã hoàn thành campaign mặc định.
