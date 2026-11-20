# Retro — Đảo Đèn Lồng, bốn phase

## Evaluation

Phase1 tạo vòng chơi Đêm1 và headless; yêu cầu hình ảnh3D dẫn tới nhân vật, đèn và cảnh procedural. Điểm yếu là số liệu tự chọn, chưa có chuẩn cảm giác điều khiển. Không có commit/tag Phase1 riêng; đánh giá dựa vào tài liệu/proof, không nhận đã có bản nộp độc lập.

Phase2 chuẩn hóa số liệu, ba bản đồ, dash/pad/tầng/gió, Gió Lạc, bùa và campaign. Dùng chung simulation cho web/CLI giúp sửa physics một lần rồi kiểm hai đường. Fixtures biên hữu ích hơn chỉ nhìn một lượt chơi đẹp. Ảnh bản đồ và campaign pre-lit phải ghi rõ là kiểm chứng phần riêng, không phải thắng toàn game mặc định.

Phase3 thay mô hình trạng thái. Dầu nguyên theo1/60 tránh sai ngưỡng30 và ceil refuel; ADR khóa thứ tự hao trước tương tác, chết trước bình minh. Test thắng sớm/điểm cũ được thay có lý do, không skip. Replay input thường sống14400tick,3đèn/2NgọnLửa/1102điểm là bằng chứng tích hợp mạnh hơn thế giới đặt sẵn.

Phase4 đo được nút thắt renderer: benchmark đầu89.91FPS nhưng p1 chỉ29.36. Instancing và buffer/record pool giảm allocation, đạt125.39/p1 66.64 cùng máy. Giữ kết quả thất bại giúp kiểm toán. Soak10Đêm không crash,RSS tăng khoảng6%. Leaderboard kiểm ghi đồng thời,restart,export và UI; accessibility kiểm computed style và thao tác thật.33JSONL giống Phase3,78test đạt. Chưa có test ẩn/máy giảng viên; chưa thay được đánh giá độc lập.

## Làm việc với AI

AI hiệu quả khi chuyển ticket thành state machine, sinh fixtures chạy lại được và nối simulation/UI. Không hiệu quả khi tin ảnh đẹp, lời “đã tối ưu” hoặc FPS trung bình. P1 thấp bác bỏ đánh giá quá sớm; đầu ra command mới phát hiện được.

Lỗi cụ thể Phase4: comparator ban đầu thêm contract_version vào snapshot vốn không có field đó, gây deep equality sai; đọc JSONL đầu giúp sửa thành so nguyên trạng. Một lần ghi qua pipe PowerShell làm mất dấu tiếng Việt; đọc lại phát hiện và thay bằng Unicode đúng. Browser tích hợp thiếu module; fallback CDP được ghi rõ, không nhận công cụ lỗi là thành công. AI cần kiểm chứng cả công cụ, dữ liệu và lời báo cáo của chính mình.

Harness hữu ích nhất: AGENTS.md giữ nguồn luật, skill giữ thứ tự tick/giới hạn bằng chứng, verify so hai process và proof lịch sử. Unit test bắt biên, browser bắt wiring thật, benchmark bắt allocation mà headless không thấy. CI có cấu hình nhưng không gọi “CI xanh” khi chưa quan sát run thật.

## Token, chi phí và lần làm lại

Không có bộ đếm token/billing tổng cả bốn phase. Ước lượng hồi cứu200.000–500.000token qua nhiều lượt/compaction, độ tin cậy thấp; không phải số đo/hóa đơn. Không thể quy thành tiền thực trả khi thiếu gói/model/tỷ lệ input-output-cache. Chỉ tính tiền khi có token thực và đơn giá tương ứng, không tự gán USD.

Tiết kiệm bằng rg có mục tiêu, đọc từng phần, script sinh bằng chứng thay dán JSONL dài, giữ summary quyết định và chỉ lặp test khi thay đổi liên quan. Nếu làm lại: commit/tag từng phase ngay khi xong, dựng performance scene sớm, tách gameplay/presentation từ đầu, chuẩn bị recorder/package trước ngày release. Người dùng vẫn cần chơi thử/nghe audio; automation không thay đánh giá cảm giác và độ rõ cảnh báo.
