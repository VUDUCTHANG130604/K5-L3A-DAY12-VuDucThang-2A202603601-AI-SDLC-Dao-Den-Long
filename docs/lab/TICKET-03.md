# TICKET-03 — Đèn cạn dầu · Phase 3

Nguồn: yêu cầu đầy đủ do người dùng cung cấp trong chat ngày2026-11-20. Change Request thay đổi luật cốt lõi, ưu tiên rất cao, tag `phase-3`, contract1.2. Mục tiêu đổi từ thắp hết sang giữ đủ ánh sáng tới bình minh; các phần sáng tạo giữ lại nếu không xung đột hoặc đổi headless.

## Các luật thay thế và bổ sung

| Nội dung | Yêu cầu |
| --- | --- |
| Dầu | Max100; thắp lần đầu/thắp lại đặt100. Lit hao1/s, tức1/60mỗi active tick |
| Châm | E ở đèn lit: used=min(carried,ceil((100−fuel)/10)), thêm10×used clamp100, trừ used; full used0 không được chọn, không event/điểm |
| Chọn đèn | Receiver chưa lit hoặc lit chưa full; gần nhất, ID nhỏ hơn khi bằng nhau |
| Cạn | Fuel≤0 → tắt, deposited0, eventlantern_out, giảm ambient; ever_littrue giữ |
| Thắp lại | Ever_lit cần5, chưa bao giờ sáng cần10 |
| Hình ảnh | Fuel bar trên đèn lit, fuel<30 đèn/bar nháy1Hz |
| Safe | Fuel<30 mất safe; đúng30 còn safe6m |
| Wander | Chỉ wander chọn weak lit<30 gần nhất/ID, không có thì unlit gần nhất; chase không đổi mục tiêu |
| Drain | XZ≤2m target → state drain, đứng yên hút5/s mỗi shade, cộng dồn và còn hao1/s |
| Thoát drain | Chase nếu Mây trong6m; stunned khi pulse; wander nếu targetout/fuel≥30/distance>2. Hết stun vềwander |
| Safe phục hồi | Refuel≥30 đẩy shade bên trong6m ra mép trong≤30tick, không hit khi đẩy |
| Thời lượng mới | Đêm1/2/3 =240/270/300s |
| Thắng mới | Chỉ hết giờ, còn sống, sốlit≥ceil(.6×total):3/5,4/6,5/7. Không thắng sớm |
| Kết thúc | no_flames ưu tiên tuyệt đối; won/dawn_survived; lost/dawn nếu không đủ. Bỏ all_lit |
| Thứ tự | Giữ Ticket02; burn+drain ở bước2, out ngay sau bước2; verdict sau toàn bộ cập nhật kể cả tick cuối |
| Capacity | 10+2×successful_lights, max20. Tính cả relight, không tính scenario-lit, reset mỗi Đêm. HUD carried/capacity |

## Điểm thay toàn bộ công thức cũ

Nạp mới/thắp lại/refuel +5/đốm; lần đầu+100; relight+40. Pulse+5 mỗi shade, **tổng15** nếu ngay trước đó drain. Dawn chỉ won: mỗi lit+50+floor(fuel), mỗi flame+50. Bỏ bonusthời gian. Campaign và retry như Ticket02.

## Mù màu

Settings lưu “Bảng màu dễ phân biệt”: rim/eyes#7A3CFF→#00B3FF; warningUI#FF5A5F→#FFFFFF và⚠. Đèn unlit xẹp20%, giấy rách để phân biệt không cần màu; lowfuel nháy.

## Contract1.2

Tuning thêm fuel_max100, fuel_decay_per_s1, fuel_per_mote10, relight_cost5, win_ratio.6, drain_per_s5, low_fuel_threshold30, capacity_max20 và thời lượng240/270/300.

Snapshot đèn thêm fuel(1decimal, unlit0), ever_lit, relit_count; player thêmcapacity; shade state thêmdrain. Scenario lantern lit/fuel/ever_lit, lit:true khôngfuel mặc định100; player.successful_lights; shades.target_lantern_id. Event refuel{lantern_id,amount,fuel}, lantern_out{lantern_id}, fuel_drain{lantern_id,shade_id,fuel} mỗi60tick khi hút; lantern_lit thêmrelightbool; game_over thêmdawn_survived và bỏall_lit.

DoD: bằng chứng chạy đúng, ADR thay stateđèn/win, sửa/xóa test sai có ghi lý do (không skip âm thầm), changelog breaking changes, regressionPhase1/2 không bị thay vẫn đúng. Không được tự đổi số chuẩn hoặc đầu ra để cứu sáng tạo/replay.
