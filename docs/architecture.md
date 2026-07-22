# System Architecture & Technical Specification

## 1. Overview
EPI-KM Platform เป็นระบบกลางสำหรับวิทยากรจัดการอบรมและติดตามวัคซีนเด็ก 0-5 ปี รองรับหลาย รพ.สต. (Multi-session) โดยผสมผสานสถาปัตยกรรม 3 ชั้น:

1. **Frontend / Presenter / Audience UI:** Single-Page Application HTML5/CSS3 (Warm Cartoon Neo-Brutalism)
2. **API Proxy Layer:** Cloudflare Workers Service `dbvaccine` ทำหน้าที่ซ่อน Backend API, จัดการ CORS, Rate Limiting, และ Data Isolation
3. **Database & Core Logic Layer:** Google Apps Script Web App + Google Sheets Database

## 2. Security & Data Privacy
- **No Direct GAS Access:** Browser ทุกชนิดสื่อสารผ่าน Cloudflare Workers Proxy เท่านั้น
- **Data Isolation:** ข้อมูลเด็ก ผู้ปกครอง ผลประเมิน และนัดหมาย ผูกด้วย `SessionID`
- **Audience Display Safety:** จอภาพสาธารณะดึงเฉพาะ Aggregated Counts/Metrics ไม่มีการส่ง PII (ชื่อ/เบอร์โทร/ตำแหน่ง)
