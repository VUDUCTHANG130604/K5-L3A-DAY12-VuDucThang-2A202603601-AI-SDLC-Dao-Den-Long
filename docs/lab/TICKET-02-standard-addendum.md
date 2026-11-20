# TICKET-02 — Ba hòn đảo · bảng chuẩn được bổ sung

Nguồn: toàn văn TICKET-02 người dùng gửi trong chat ngày 2026-11-20, bổ sung cho [bản dán ban đầu](Phase-2-Contract-v1.1-received.md) bị mất bảng. Contract **v1.1**, tag **phase-2**. Tên chính thức: Đêm 1 Đảo Bến, Đêm 2 Đảo Cau, Đêm 3 Đảo Chuông. Bản đồ và tính năng trong bản dán đầu được giữ nguyên, với tên được sửa theo toàn văn.

| Nhóm | Số chuẩn bắt buộc |
| --- | --- |
| Chạy | 6 m/s, tăng tốc/dừng ≤0.1 s, điều khiển trên không đầy đủ |
| Nhảy | vy=7 m/s, gravity=-20 m/s², chỉ khi grounded |
| Dash | 14 m/s, 12 tick, cooldown 90 tick từ lúc bắt đầu; hướng di chuyển hoặc facing; trên không giữ cao; không bất tử |
| Túi / nhặt | 10 đốm; XZ≤1 m và chênh cao chân/điểm đất≤1.5 m |
| Sinh đốm | 20 ở 20 điểm khác nhau lúc đầu; trần30; mỗi240tick thêm1 nếu còn chỗ trống |
| Đèn | 10 đốm, nạp nhiều lần; XZ≤2; chọn chưa sáng gần nhất, hòa ID nhỏ hơn |
| Safe | 6 m; shade ngoài bị chặn, shade ở trong bị đẩy ra trong tối đa30tick và không gây hit khi đang đẩy |
| Pulse | Tốn3, radius3D5 m từ chân Mây+0.8; cooldown180tick; target chốt khi kích hoạt; stun120tick, đẩy4m trong15tick đầu theo XZ; trùng thì+X; dừng khi gặp cản; pulse mới làm mới stun/push |
| Shade | 4 m/s (Đêm3 4.5); phát hiện12m, bỏ đuổi18m; chạm XZ≤1 và chênh cao≤1.5; tối đa1 hit/tick; shade gây hit recoil2m/60tick; chạm khi invuln không recoil |
| Spawn shade | Hai con tick300; sau đó1 mỗi khoảng sinh:480/420/360 tick, tối đa6/8/10 theo Đêm; điểm spawn cách Mây≥15m, hết điểm thì bỏ lượt; S1,S2… |
| Hit | -1 flame, rơi floor(carried/2) ở vành1.5–2.5m, TTL480tick, nhặt từ tick sau; invuln90tick |
| Fall | Y<−10, đúng1 hit bỏ qua invuln; mất toàn bộ túi; chờ60tick không nhặt/chạm, respawn origin vel0 invuln90; hết flame thua ngay |
| Flames / thời lượng | 3 đầu mỗi Đêm; 300/330/360 s |
| Kết thúc | no_flames ưu tiên; còn sống và all_lit thắng kể cả đúng dawn; còn lại hết giờ lost/dawn |
| Điểm | +10 mỗi đốm **nạp**, +100 mỗi đèn, +5 mỗi shade trúng pulse (kể cả đang stunned); thắng thưởng floor(time_left)×2+50×flames; campaign cộng điểm các Đêm đã thắng |

| Thành phần | RGB Hex chuẩn |
| --- | --- |
| Trời / sương | #0E1430 / #1B2350 |
| Cỏ / cát / gỗ / biển mây | #2F5D50 / #C9B48A / #6B4A2F / #12384A |
| Đèn sáng / lõi / tắt | #FFB347 / #FFE9B0 / #5B5F6E |
| Đom đóm lõi / quầng | #FFF6C2 / #FFE58A |
| Shade thân / viền / stunned | #120A1A / #7A3CFF / #3A3450 |
| Áo Mây / khăn và Bùa | #E8E2D0 / #C8102E |
| Viền vàng, điểm / Gió Lạc | #F2C14E / #8FA3B8 |
| UI nguy hiểm / chữ | #FF5A5F / #F5F1E6 |

Sai lệch tối đa10% mỗi kênh của các màu thành phần. Ambient `0.15+0.55×lit/count`. DoD: bằng chứng thực, regression Phase1 với số chuẩn, acceptance criteria từng tính năng, harness/skill được cập nhật trong lịch sử Git, ít nhất một scenario headless cho mỗi tính năng gameplay mới, ≥30FPS trung bình1280×720, một Đêm headless21600tick≤30s.
