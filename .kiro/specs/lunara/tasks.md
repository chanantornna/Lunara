# Implementation Plan — Lunara

## เฟส 1: แกนหลัก + Daily Check-in

- [ ] 1. Scaffold โปรเจกต์และ tooling
  - สร้าง Vite + React + TS, ติดตั้ง Tailwind, Dexie, Recharts, date-fns, vite-plugin-pwa, Vitest
  - ตั้งค่า tailwind palette พาสเทล + dark mode, index.css, tsconfig
  - _Requirements: 1.1_

- [ ] 2. Data layer (Dexie)
  - [ ] 2.1 สร้าง db schema (profile, periods, periodDays, checkins, weights + ตารางเฟสถัดไป)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_
  - [ ] 2.2 repository CRUD helpers + hooks (useLiveQuery, useProfile)
    - _Requirements: 1.1_
  - [ ] 2.3 seed data แบบเปิด/ปิดได้
    - _Requirements: 1.7_

- [ ] 3. Domain logic + unit tests
  - [ ] 3.1 cycle.ts (avg length, regularity, predict next, cycle day, fertile window, phase, pregnancy chance)
    - _Requirements: 1.2, 1.3, 1.7_
  - [ ] 3.2 body.ts (BMI, category, BMR, TDEE, safe calorie target)
    - _Requirements: 1.4, 1.5, 1.7_
  - [ ] 3.3 unit tests สำหรับ cycle.ts และ body.ts (Vitest)
    - _Requirements: 1.7_

- [ ] 4. Shared UI components
  - BottomNav, FloatingAddButton (+ bottom sheet), Chip/ChipGroup, RatingScale, Card, TipCard, theme toggle
  - _Requirements: 1.1_

- [ ] 5. หน้าแรก (Today)
  - วันของรอบ, คาดการณ์ประจำเดือนถัดไป, ช่วงโอกาสตั้งครรภ์ (ประมาณการ), การ์ดคำแนะนำพื้นฐาน, ปุ่มลัด
  - จัดการกรณีข้อมูลไม่พอ
  - _Requirements: 1.2_

- [ ] 6. ปฏิทินรอบเดือน
  - ปฏิทินรายเดือน + สี/สัญลักษณ์ (ประจำเดือน/คาดการณ์/ไข่ตก/บันทึก), แตะวันเพื่อบันทึกประจำเดือน, สรุปความยาวรอบ/ความสม่ำเสมอ
  - _Requirements: 1.3_

- [ ] 7. Daily Check-in + quick logs (หน้าบันทึก)
  - ฟอร์ม chip เดียวจบ: อารมณ์, สุขภาพ, ตกขาว, สิว; แก้ย้อนหลัง; ข้ามฟิลด์ได้
  - _Requirements: 1.6_

- [ ] 8. น้ำหนัก/BMI (หน้าสถิติเฟส 1)
  - บันทึกน้ำหนัก, คำนวณ BMI, กราฟแนวโน้ม (Recharts)
  - _Requirements: 1.5_

- [ ] 9. โปรไฟล์ + Settings + disclaimer
  - ฟอร์มโปรไฟล์, toggle seed, theme, disclaimer, (placeholder privacy/notification)
  - _Requirements: 1.4, 1.1_

- [ ] 10. PWA + verify
  - manifest, icons, service worker, build ผ่าน, test ผ่าน, รัน dev ได้
  - _Requirements: 1.1_

## เฟส 2: ยาคุมและเซ็กซ์ (ทำหลังเฟส 1 ผ่าน)
- [ ] 11. ยาคุมประจำ (schedule, ติ๊กกิน, เม็ดคงเหลือ, เตือนลืม/ใกล้หมด, คำแนะนำลืมกิน)
  - _Requirements: 2.1_
- [ ] 12. ยาคุมฉุกเฉิน (บันทึก, นับครั้ง, เตือนตรวจครรภ์เมื่อประจำเดือนช้า)
  - _Requirements: 2.2_
- [ ] 13. บันทึกเพศสัมพันธ์ (ป้องกัน, prompt ยาคุมฉุกเฉิน, โหมดส่วนตัว)
  - _Requirements: 2.3_

## เฟส 3: ไลฟ์สไตล์
- [ ] 14. ออกกำลังกาย (บันทึก + เป้ารายสัปดาห์ + สรุป)
  - _Requirements: 3.1_
- [ ] 15. การนอน (เวลา, ชั่วโมง, คุณภาพ, กราฟ)
  - _Requirements: 3.2_
- [ ] 16. อาหาร/แคลอรี่/น้ำ (ฐานอาหารไทย 30+, เป้าจาก TDEE, กินvsเป้าvsเผาผลาญ, น้ำดื่ม, safe limits)
  - _Requirements: 3.3_

## เฟส 4: คำแนะนำ เตือน รายงาน ความเป็นส่วนตัว
- [ ] 17. Tips engine (rule config + runner) + unit test ทุกกฎ
  - _Requirements: 4.1_
- [ ] 18. การ์ด tips 3 ระดับในหน้าแรก + เปิดปิดหมวด
  - _Requirements: 4.1_
- [ ] 19. รายงาน/Insights + export PDF
  - _Requirements: 4.2_
- [ ] 20. ความเป็นส่วนตัว (PIN lock, ซ่อนด่วน, export/import JSON/CSV, ลบทั้งหมด)
  - _Requirements: 4.3_
- [ ] 21. แจ้งเตือน (Notification API, ตั้งเวลา/เปิดปิดต่อประเภท, ไม่โชว์เนื้อหาอ่อนไหว)
  - _Requirements: 4.4_
