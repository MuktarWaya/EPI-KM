# Implementation Plan: Web App “EPI รพ.สต.ประจัน” & Live Teaching Multi-Session Platform

## 1. สรุปความเข้าใจในระบบ (Executive Summary & Core Goal)
ระบบนี้ได้รับการออกแบบให้เป็น **"เครื่องมือกลางสำหรับวิทยากรในการจัดการอบรมวัคซีนเด็ก 0-5 ปี"** ที่สามารถใช้งานหมุนเวียนหลาย รพ.สต. (โดยเริ่มที่ รพ.สต.ประจัน เป็นพื้นที่แรก) 
โดยผสมผสาน:
1. **Frontend / Presenter View / Audience Display**: พัฒนาด้วย HTML5, Vanilla CSS (Warm Cartoon Neo-Brutalism Design System), JS (Vanilla + Chart.js + SweetAlert2) ผ่าน Cloudflare Worker Service `dbvaccine`
2. **Backend Proxy & Session Router**: Cloudflare Workers เป็น API Gateway ซ่อน GAS URL/Spreadsheet ID จัดการ Auth, CORS, Rate Limit, และ Data Isolation ราย SessionID
3. **Database & Business Logic**: Google Apps Script (GAS) + Google Sheets สำหรับจัดเก็บข้อมูลแบบ Multi-tenant / Multi-session
4. **KS Model & Flag Routing**: แบบสอบถาม Likert 8 ข้อเพื่อจำแนกปัญหาและความกังวล โดยไม่มีการตัดเกรด/รวมคะแนนอัตโนมัติ (ยังไม่มีคู่มือ) แต่ใช้ Flag เพื่อ Route สื่อเรียนรู้เฉพาะบุคคล
5. **Live Teaching Mode**: สไลด์ HTML 50 สไลด์ รองรับ Presenter View (พร้อม Speaker Notes & Activity Controls) และ Audience Display (แสดงผลรวม Real-time ปลอดภัยไม่เปิดเผย PII)

---

## 2. การวิเคราะห์ Gap & ความเสี่ยง (Gap Analysis & Risk Matrix)

| ประเด็น | สถานะปัจจุบัน | แผนการจัดการ / ทางแก้ไข |
|---|---|---|
| **Data Isolation** | เดิมเป็น Single Health Center WebApp | เพิ่ม `SessionID` ในทุก Sheet และทุก API Endpoint เพื่อแยกข้อมูลรายรอบการสอน |
| **Real-time Engine** | GAS ไม่มี WebSockets | ใช้ Polling Architecture (3-5 วินาที) ฝั่ง Frontend ร่วมกับ CacheService ใน GAS |
| **KS Model Assessment** | ยังไม่มีมาตรฐาน Scoring Cut-off | บันทึก Q1-Q8 ตรงๆ + สร้าง Routing Flags สำหรับ Learning Path ห้ามตัดเกรด |
| **PII Leak in Presentation** | สไลด์สดอาจเผลอแสดงชื่อผู้ปกครอง/เด็ก | Audience Display จะแสดงเฉพาะ Aggregated Data (Count, %, Charts) ห้าม render รายชื่อ |
| **Sheet Performance** | การอ่าน/เขียน Sheets ทีละ row ช้า | Batch Operation (Read/Write range) + LockService ป้องกัน Concurrent Submit |

---

## 3. สถาปัตยกรรมระบบ (Architecture Overview)

```
[ Audience / Parents ]  <---> [ Cloudflare Workers: dbvaccine ] <---> [ Google Apps Script (GAS) ] <---> [ Google Sheets Database ]
[ Presenter / Trainer ] <--->           (API Gateway / Proxy)           (Business Logic & Auth)        (Multi-Session Data)
[ Staff / Volunteers  ] <--->
```

---

## 4. แผนโครงสร้าง Google Sheets Schema & Migration (Database Design)

### Sheets ที่ต้องสร้าง/ตรวจสอบ (`setupSpreadsheet`):
1. **`Settings`**: Config กลาง
2. **`Users`**: เจ้าหน้าที่/อสม./วิทยากร
3. **`TrainingSessions`**: [NEW] ข้อมูลรอบการสอน
4. **`Children`**: ข้อมูลเด็กและผู้ปกครอง
5. **`PreTest`**: ผลก่อนเรียน
6. **`AcceptanceAssessment`**: KS Model
7. **`AssessmentFlags`**: Flag รายบุคคล
8. **`Quizzes`**: ตอบเกม เขียว-เหลือง-แดง & จริง/ไม่จริง
9. **`PostTest`**: ผลหลังเรียน
10. **`Appointments`**: การแจ้งความประสงค์นัด
11. **`Questions`**: คำถามถึงเจ้าหน้าที่
12. **`FollowUp`**: การติดตามโดย อสม./เจ้าหน้าที่
13. **`SlideDecks` & `Slides`**: [NEW] สไลด์ HTML องค์ความรู้ & กิจกรรมสด
14. **`LiveActivities`**: [NEW] สถานะกิจกรรมสด
15. **`Logs`**: Audit Trail

---

## 5. แผนการดำเนินงานเป็น Phase (Implementation Phases)

### Phase 1: Audit & Environment Sync
- ตรวจสอบ Git Repository `https://github.com/MuktarWaya/EPI-KM.git`
- ตรวจสอบ Google Spreadsheet & Backup โครงสร้างเดิม
- สร้าง Branch `feature/epi-live-teaching-cloudflare`

### Phase 2: Core Foundation & Design System (Warm Cartoon Neo-Brutalism)
- สร้าง `src/styles/neobrutalism.css` พร้อม Design Tokens ตาม Spec
- สร้าง Component Library (Cards, Buttons, Chips, Progress Bars, Status Strips, Steppers, Modals)
- สร้าง Worker Router & Middleware (Auth, CORS, Security Headers, Rate Limit)

### Phase 3: GAS Backend & Spreadsheet Engine
- พัฒนา `gas/Code.gs`, `gas/Database.gs`, `gas/SessionService.gs`, `gas/AssessmentService.gs`
- เพิ่มฟังก์ชัน `setupSpreadsheet()`, `migrateSpreadsheet()`, `withLock()`
- พัฒนา API สำหรับ Parent Journey & Trainer Live Controls

### Phase 4: Parent Journey & KS Model Routing
- หน้า Privacy & Consent -> Registration -> PreTest -> KS Model (Likert 8 ข้อ)
- Algorithm สรุป Routing Flags (SAFETY_CONCERN, ACCESS_BARRIER, RELIGIOUS_BELIEF_CONCERN, etc.)
- Personalized Learning Path (ปรับบทเรียนตาม Flag)
- Games (เขียว-เหลือง-แดง & จริง/ไม่จริง) -> PostTest -> Appointment Request -> Summary Card

### Phase 5: Live Teaching Mode & HTML Slide Deck (50 Slides)
- สไลด์องค์ความรู้ + กิจกรรมสด (Live Poll, Live KS Distribution, Live Count)
- Presenter View: ควบคุมสไลด์, สลับสถานะกิจกรรม, อ่าน Speaker Notes, Timer
- Audience Display: แสดงเนื้อหา, QR Code, กราฟผลลัพธ์สดแบบไม่เปิดเผยตัวตน

### Phase 6: Trainer / Staff / Volunteer Dashboards & Handover Export
- Teacher Dashboard & Live Metrics
- Staff Review & Flag Management
- Volunteer (อสม.) Follow-up Board แยกตามหมู่บ้าน
- Multi-format Export (Excel Workbook, Followup CSV, Handover PDF Summary)
- Data Retention & Anonymization Engine

### Phase 7: Automated Testing, Deployment & Verification
- Unit & Integration Tests (Validation, KS Routing, Session Isolation)
- Deployment ไปยัง Cloudflare Worker `dbvaccine` & GAS Deployment
- Smoke Testing 35 Test Cases
