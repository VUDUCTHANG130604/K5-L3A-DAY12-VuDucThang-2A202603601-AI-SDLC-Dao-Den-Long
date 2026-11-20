# Phase 1 — giả định và nhật ký AI

Nguồn: tài liệu lab gốc trong `docs/lab/` và [PRD-0 / Test Contract v1.0](../lab/PRD-0-Test-Contract-v1.0.md) do người dùng dán vào phiên làm việc. Bản mô phỏng 3 đèn và headless tạm trước đó đã được thay bằng 5 đèn và contract chính thức. Không còn sử dụng local-draft-v1.

## Quyết định

WebGL + Node ES modules, không dependency/CDN để chạy web trên laptop và headless không cần GPU. `src/game.mjs` là mô phỏng chung, tick 1/60 s; chỉ renderer dùng thời gian thực cho hiệu ứng. `src/tuning.mjs` là tuning của logic, build/test đối chiếu nó với `game.contract.json`. Scenario, input persistent, cạnh nút, tick/event và JSONL theo contract.

Các số cân bằng, thứ tự sự kiện, vùng an toàn, cách nạp từng phần, cách làm tròn/rơi đom đóm và điểm được ghi trong [TEST-CONTRACT.md](../TEST-CONTRACT.md). Đây là các lựa chọn cho phần PRD để mở. Nhảy không tránh hit vì khoảng cách XZ là quy định contract. Không có dash/phạt rơi/sinh thêm shade giữa màn.

## Hình ảnh

Theo yêu cầu nâng cấp mô hình của người dùng: hình học xoay tròn mượt hơn, nhân vật có áo/tay/chân/dép/mặt/nón lá, đèn nhỏ treo nón; đèn lớn có nan, mái, thân giấy và bệ đá. Thêm cành cây/cỏ/đá/bờ tròn, mây thấp, shader bề mặt, shadow map, nguồn sáng cục bộ tại đèn. Không dùng asset ngoài; giữ không khí cổ tích đêm. Có giới hạn zoom để chơi được và không cần photorealism.

## Nhật ký AI thực tế

Codex đọc file lab, triển khai baseline rồi điều chỉnh khi nhận PRD/Test Contract chính thức. Thêm harness, test, replay thắng bằng input thông thường và báo cáo. Phát hiện replay ban đầu bỏ qua một số đốm khi đầy túi; bổ sung đoạn quay lại nhặt đốm còn lại, không chỉnh state để tạo thắng.

Browser trong ứng dụng trước đó không kết nối được do thiếu module `classic-level.mjs`. Dùng Chrome headless cục bộ/SwiftShader làm fallback, profile tạm, không truy cập website ngoài. Kiểm tra mới gặp tốc độ software render thấp hơn giả định wall-clock cũ; đổi kiểm tra di chuyển sang đợi đủ 60 tick mô phỏng, đồng thời giảm số đỉnh tán cây. Không coi đó là benchmark hiệu năng trên laptop có GPU.

Kiểm chứng: 25 unit/CLI tests; replay seed 12 thắng 5 đèn ở tick 2633, còn 3 tim, 1652 điểm; timeout không shade đúng tick 18000. Harness chạy CLI hai lần và so từng byte JSONL. Chrome kiểm tra render/shadow shader, input W, Space, HUD, pause/resume/restart, cửa sổ hẹp; ảnh replay thắng được render trong canvas QA riêng, không giả làm người chơi hoàn thành bằng tay. Bằng chứng sinh bởi lệnh trong `docs/proof/phase-1`.

Qua xem ảnh đã phát hiện vân nhiễu shadow map. Sửa hệ số chuyển đổi giữa depth packing cơ số 256 và texture UNORM8 cơ số 255, tắt dithering khi ghi depth; ảnh mới xác nhận hết vân. Các đốm nhỏ dùng mesh ít đỉnh hơn. Kiểm tra Space cũng chờ trạng thái nhảy thực tế thay vì thời gian chờ cố định để chạy ổn định với software renderer.

Không có số token/chi phí đo được; không điền giả. Dùng chung logic, thư viện chuẩn, hình học procedural để giảm tải công nghệ.

## Giới hạn còn lại

Chưa có bộ test ẩn của giảng viên, video, đánh giá độc lập/chơi thử thủ công đầy đủ; chưa chạy trực tiếp macOS/Linux hay GitHub CI. Chưa tạo public repo/tag/push. Input cần bàn phím, chưa có cảm ứng. Hình ảnh là procedural 3D, chưa phải mô hình điêu khắc/PBR photorealistic. `.github/workflows/test.yml` chạy cùng harness trên Ubuntu khi được push.
