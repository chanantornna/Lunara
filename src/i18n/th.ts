// Thai dictionary (primary language). Keys are stable; en.ts mirrors them.
export const th = {
  appName: 'Lunara',
  nav: {
    today: 'วันนี้',
    calendar: 'ปฏิทิน',
    log: 'บันทึก',
    stats: 'สถิติ',
    settings: 'ตั้งค่า',
  },
  common: {
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    add: 'เพิ่ม',
    today: 'วันนี้',
    optional: 'ไม่บังคับ',
    notEnoughData: 'ข้อมูลยังไม่พอ ลองบันทึกเพิ่มอีกหน่อยนะ',
    estimate: 'ค่าประมาณ',
  },
  disclaimer:
    'ข้อมูลและคำแนะนำทั้งหมดเป็นค่าประมาณและข้อมูลทั่วไป ไม่ใช่คำแนะนำหรือการวินิจฉัยทางการแพทย์ หากมีอาการน่ากังวลควรปรึกษาแพทย์',
};

export type Dict = typeof th;
