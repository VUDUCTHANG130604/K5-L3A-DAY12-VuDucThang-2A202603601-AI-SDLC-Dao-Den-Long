# Test Contract v1.2 — semantics triển khai

Nguồn: [TICKET-03](lab/TICKET-03.md), kế thừa Ticket02/PRD0 ở phần không bị thay. Manifestv1.2 tại `game.contract.json`, build kiểm tra deep equality với `src/tuning.mjs`. ADR mô hình fuel/dawn tại [ADR-0001](adr/0001-lantern-fuel-and-dawn.md); thay đổi breaking và test migration tại [CHANGELOG](../CHANGELOG.md).

CLI từ repo: `node scripts/headless.mjs --seed 12 --night 3 --scenario scenario.json --inputs inputs.json --ticks 18000 --out result.jsonl --snapshot-every 10`. Node20+, khôngGPU. Exit0 hợp lệ kể cảlost/paused,2 JSON/schema sai,1 cờ/I/O sai. Fieldđầu vào v1.0–1.1 không bị thay tiếp tục được nhận.

## Tick, input và output

Snapshot0 sau dựng scenario, trướcinput; dựng khôngevent/điểm/success count. Bướck đọcframe.tick=k tạo event/state tickk+1. Input persistent, mặc địnhmove[0,0]/yaw0/nútfalse; tick frame tăng nghiêm ngặt; jump/dash/interact/pulse/pause kích hoạt cạnhfalse→true; move/yaw theo công thứcv1.0. Tick vẫn tăng khi paused, sim_tick/time/timers/TTL/fuel/drain/spawn đứng. Resume chạy bướcgameplay ngay tickresume. Không chạy sau won/lost.

Snapshot mỗiN tick bắt đầu0, thêm snapshotcuối nếu cần, luôn dòngend cuối. `state` playing/paused/won/lost; `time_left_s=max(0,scenarioDuration−sim_tick/60)`, mặc định240/270/300. Pos/vel round3decimal; fuel round1decimal, JSONnumeric có thể in100 thay100.0 nhưng cùng độ chính xác. Không sử dụng roundoutput trong logic.

Root có night/wind{active,dir_deg}. Player giữpos/vel/grounded/flames/carried/invuln(bool)/dash_cd_s/pulse_cd_s/charm_s và thêmcapacity. Lanterns đủ5/6/7, mỗiid/pos/lit/deposited/fuel/ever_lit/relit_count; unlitfuel0. Shades giữid/pos/state, state mới drain bên cạnh spawning/wander/chase/recoil/stunned. Motes luôn id/pos/kind(random/dropped)/ttl_s (randomnull, droppedseconds). Drifters id/pos/state/stolen, giữremoved để tham chiếuID. Charms id/available/respawn_s.

Các event cũ không bị thay giữ nguyên; lantern_lit data thêmrelightbool. Event mới refuel{lantern_id,amount,fuel}, lantern_out{lantern_id}, fuel_drain{lantern_id,shade_id,fuel}; fuel event cũng round1. `game_over` won/dawn_survived, lost/dawn hoặcno_flames; **không all_lit**. night_start ở bướcactive đầu tiên (không phảiconstruct). Không thêm eventvisual/audio/colorblind.

## Scenario

- Player pos/carried/flames và invuln_ticks/dash_cd_ticks/pulse_cd_ticks/charm_ticks giữ nguyên; thêm successful_lights integer≥0. Capacity=min(20,10+2×count), carried phải≤capacity. Defaultcount0/vel0/facing+Z; grounded suy từ mặt đất. Scenario-lit không tăngcount.
- Lanterns cập nhật theoL1…Ln, không nhắc giữmặcđịnh. Cho đặtpos/deposited/lit/fuel/ever_lit. Fuel finite0..100, round vềunit1/60. Littrue khôngfuel mặc định100 vàeverLittrue; unlitfuel0, relitCount0 khi dựng. Deposited giới hạncost hiện tại(10hoặc5); nếu không chỉđịnhlit màdeposited đủcost thìdựnglit, vẫn khôngđiểm/success. Littrue fuel0 đượcgiữđếnbước2 đầu đểcóout eventđúnglúcchạy, khôngpháquytắcdựngkhôngevent.
- Shades thaylist: pos/id?/state?/state_ticks_left?, thêmtarget_lantern_id (null hoặcIDđèn tồn tại). Scenario defaultchase tương tác từbước1. Drain thiếuID tựchọnweak trong2m gầnnhất; khôngcótồntạitarget thìwander ởbước8. Stun/recoil dùngcounter đãcho.
- Drifters list thaythế: pos/id?/state?/stolen?/state_ticks_left?; flee mặcđịnh240 vàhướngrờixaMây. Charms listthaythế: id/pos/available/respawn_ticks hoặcrespawn_s; unavailable khôngtimer mặcđịnh2700tick; cóthểbỏpos nếuIDbùamặcđịnh.
- Motes nhận[x,y,z] cũ hoặc{id?,pos,kind?,ttl_s?}; dropped mặcđịnh8s. IDtrùng/counterâm/schemalỗi trả2. Randomflagsfalse tắtcảkhởitạovàlịchsinh, chỉgiữthựcthểliệtkê. Explicitlist thayinitiallist nhưnglịchvẫnchạynếukhôngtắtflag. wind_enabledfalse tắtgió.

## Thứ tự và trạng thái dầu

12stageTicket02 đượcgiữ: pause → counters+fuel/drain/out → move/jump/dash/pad/wind/fall → pickup/charm → interact → safe → pulse → enemies → driftertheft rồishadehit → scheduledspawn → verdict → output. Counter integer giảm trướcaction; durationmới đầyđủtạiaction. Scheduledspawn ởcuối nênchỉtươngtáctừtick sau. Drop từhit/pulsereturn cũngsaupickup nênkhôngnhặtngay; TTLgiảmtừbướcsau.

`fuelUnits`0..6000, mỗiactiveburn1 cộng5/shadedrainhợp lệ. Drain counter riêngmỗishade, logmỗi60active ticks hútliêntục, freeze khi pause, resetkhirờidrain. Eventchứafuel sau tổngburn/drain; logởmốccùngtickcạntrướcout. Out resetlit/deposited/fuel, giữnguyênhistory. Newlight/relight đặt6000, cost10/5. Refuel tínhceil rawunits, clamp6000, khôngtăngcapacity; nearesteligible/ID chọnchunglit+unlit.

Safe lit&&units≥1800. Lowwander chọnweaklit gầnnhất/ID; khôngweak chọnunlit gầnnhất. Drain trong2m, chaseMây6m, dừngkhipulse/out/refuel≥30/raxa2m. Hếtstun vềwander một bước, perception thườngtừbướcsau. Safephụchồieject≤30tick, khôngdamagekhiđẩy. Pulse3D vẫnchuẩn, điểmchốttheostate trướcaction:15tổngnếudrain,5cònlại.

Sau hết mọiupdate: no_flames trước, rồi khi dawn kiểmtra ceil(.6×total)lit; cònthờigianthìvẫnplaying dùlitđủ. Bonuswon=sum(50+floor(units/60))lit +50×flames, khôngthưởngthờigian. Điểmnạp/refuel5, first100, relight40. Scenario khôngthưởng; campaign chỉcộngĐêmthắng vàretrykhôngcộnglặp.

Chi tiết khôngđổi (spawnshade300rồi480/420/360; wander/chase4/4.5; pad/dashphysics; droppedTTL; windwarning1680+1800k; GióLạc/Bùa) theoTicket02 vàcode/regression. Night3giữspawn(0,0,0), renderer cho thấyMây dưới tầngche; khôngdịchchuyểntọađộheadless vìhìnhảnh. Bộtestẩn chưađược cungcấp; khôngtuyênbốđãchạy.
