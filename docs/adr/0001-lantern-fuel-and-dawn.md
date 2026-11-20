# ADR-0001 — Dầu đèn và sống tới bình minh

Trạng thái: chấp nhận, 2026-11-20. Nguồn: TICKET-03 (v1.2) thay thế luật v1.1.

## Bối cảnh

Mô hình cũ chỉ có unlit→lit vĩnh viễn và kết thúc ngay khi đủ đèn. Mô hình đó không mô tả được châm dầu, hút dầu, tắt/thắp lại hay căng thẳng cuối Đêm. Tất cả client và CLI phải thống nhất kết quả trên từng tick.

## Quyết định

Tách logic vòng đời đèn vào `src/lanterns.mjs`, được `src/game.mjs` dùng chung cho web/headless. Đèn giữ `lit`, `deposited`, `fuelUnits`, `everLit`, `relitCount`. `fuelUnits` là số nguyên0..6000 (một đơn vị =1/60fuel). Tick active trừ1 cho đèn sáng và thêm5 mỗi shade đang drain hợp lệ. Không dùng float tích lũy. fuel/các ngưỡng/ceil/dawn-floor luôn tính từ units, output mới round1decimal.

Vòng đời: never-lit/tắt cần10 để thắp; lit đặt6000units; cạn chuyển tắt/deposited0/everLittrue; tắt từng sáng chỉ cần5 và lần thành công tăngrelitCount. Mọi lần thắp thành công trong gameplay tăngsuccessfulLights, túi min(20,10+2×success). Dựng scenario không cộng điểm/số lần; lit:true mặc địnhfuel100, everLittrue, relitCount0.

Refuel là hành động riêng, không phát deposit/lantern_lit hay tăngcapacity. Chọn receiver gần nhất/ID, bỏ đèn full chính xác6000. Dùng ceil((6000-units)/600), giới hạn inventory; clamp6000, cộng5/đốm. **Vì burn xảy ra trước tương tác, một đèn bắt đầu tick ở100 đã thành99.983… và có thể nhận1đốm ở bước5**, dù snapshot làm tròn100.0. Không làm tròn trước ceil để né quy tắc này. Test selection-full gọi helper ở statefull chính xác, test integration chứng minh timer-before-input.

## Thứ tự và AI

Giữ12 bước Ticket02, thêm burn/drain ở bước2 rồi phát out ngay, trước pickup/interact. Drain chỉ hút nếu target vẫn lit và XZ≤2 ở đầu bước; nhiều shade cộng dồn. Chọn ghi fuel_drain sau mỗi60 **bước active hút liên tục của từng shade**, reset khi ngừng/đổi trạng thái, freeze khi pause. Event chứa nhiên liệu sau tổng burn/drain của tick; nếu cạn cùng tick thì drain event (nếu đúng mốc) đứng trước out. Shade vừa chuyển drain ở bước8 chỉ bắt đầu hút từ bước2 của tick sau.

Safe dùng lit&&units≥1800. Mất safe ngay dưới30; refuel phục hồi safe ngay bước6 cùng tick. Ejection trong30tick chặn damage; ưu tiên ejection khi phục hồi safe, đồng thời vẫn thực hiện pulse push trong15tick đầu. Wander chọn weak lit gần nhất (ID khi hòa), nếu không có chọn unlit gần nhất; chase tiếp tục đuổi Mây. Drain đứng yên; đến6m thì chase, target tắt/đầy≥30/ra ngoài2m thì wander. Hết stun có một bước chuyển wander, sau đó perception bình thường. Pulse chốt điểm theo state **ngay trước pulse**: drain15 tổng, còn lại5.

## Bình minh và điểm

Không còn all_lit thắng sớm. Sau mọi cập nhật, nếu health≤0 → no_flames; nếu time_left≤0 thì countlit≥ceil(.6×count) → won/dawn_survived, còn lại lost/dawn. Đèn tắt ở bước2 tick cuối không tính; đèn thắp lại ở bước5 tick cuối có tính. Dawn bonus chỉ won: sum(50+floor(units/60)) trên đèn còn lit +50×flames; bỏ thưởng thời gian. Campaign vẫn chỉ cộng Đêm thắng và retry không cộng lặp.

## Hiển thị và tương thích

Fuel bar world-space và nhãn số hiện trên đèn lit; low<30 nhấp nháy1Hz bằng đồng hồ renderer, không làm đổi logic. Unlit paper height×0.8 và bỏ các mảng giấy tạo lỗ rách; kiểm tra cả grayscale. Colorblind chỉ ở settings/renderer/CSS: cyan rim/eyes, trắng+⚠ cho cảnh báo, lưu cùng khóa settings cũ với mặc địnhfalse. Không thêm đầu ra headless vì lựa chọn màu.

Regression không bị thay giữ nguyên; kỳ vọng cũ sai do thay luật được sửa có lý do tại CHANGELOG. Dữ liệu Phase1/2 và tag phase-2 không bị ghi đè. Bộ chấm ẩn chưa có; không tuyên bố đã chạy.
