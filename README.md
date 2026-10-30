# Lunara 🌸

เว็บแอพบันทึกและดูแลสุขภาพผู้หญิง (Women's Health Tracker) แบบ Progressive Web App
ข้อมูลทั้งหมดเก็บในเครื่องผู้ใช้ (IndexedDB) ไม่มี backend ไม่ส่งข้อมูลออกนอกเครื่อง

## Tech stack
React + TypeScript + Vite · Tailwind CSS · Dexie.js (IndexedDB) · Recharts · date-fns · PWA

## รันในเครื่อง (local)

```bash
npm install
npm run dev      # เปิด http://localhost:5173/
npm test         # รัน unit tests
npm run build    # production build -> dist/
```

> บน Windows หาก PowerShell บล็อก `npm` (execution policy) ให้ใช้ `npm.cmd ...`
> หรือรัน `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` หนึ่งครั้ง

## Deploy ขึ้น GitHub Pages

โปรเจกต์มี GitHub Actions workflow (`.github/workflows/deploy.yml`) ที่ build และ deploy
ให้อัตโนมัติทุกครั้งที่ push ขึ้น branch `main`

ขั้นตอนครั้งแรก:

1. สร้าง repository ใหม่บน GitHub (เช่นชื่อ `lunara`)
2. push โค้ดขึ้นไป:
   ```bash
   git init
   git add .
   git commit -m "Lunara phase 1"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
3. ไปที่ repo บน GitHub → **Settings → Pages → Build and deployment → Source** เลือก **GitHub Actions**
4. workflow จะรันเองและ deploy เว็บไปที่ `https://<username>.github.io/<repo>/`

workflow ตั้งค่า `VITE_BASE` เป็น `/<repo>/` ให้อัตโนมัติ จึงใช้ได้กับชื่อ repo อะไรก็ได้

## หมายเหตุด้านสุขภาพ
ข้อมูลและคำแนะนำทั้งหมดเป็นค่าประมาณและข้อมูลทั่วไป ไม่ใช่คำแนะนำหรือการวินิจฉัยทางการแพทย์
หากมีอาการน่ากังวลควรปรึกษาแพทย์
