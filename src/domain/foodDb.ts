// Basic Thai food database (per standard serving). Calories/macros are
// approximate, for estimation only. Users can adjust portion and add their own.
export interface FoodItem {
  id: string;
  name: string;
  serving: string; // description of 1 serving
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
}

export const THAI_FOODS: FoodItem[] = [
  { id: 'rice', name: 'ข้าวสวย', serving: '1 ทัพพี', calories: 160, protein: 3, carbs: 35, fat: 0 },
  { id: 'sticky_rice', name: 'ข้าวเหนียว', serving: '1 ปั้น', calories: 170, protein: 3, carbs: 37, fat: 0 },
  { id: 'krapow_moo', name: 'ผัดกะเพราหมู', serving: '1 จาน', calories: 480, protein: 24, carbs: 20, fat: 32 },
  { id: 'krapow_gai', name: 'ผัดกะเพราไก่', serving: '1 จาน', calories: 440, protein: 28, carbs: 18, fat: 28 },
  { id: 'khao_man_gai', name: 'ข้าวมันไก่', serving: '1 จาน', calories: 590, protein: 30, carbs: 65, fat: 23 },
  { id: 'khao_moo_daeng', name: 'ข้าวหมูแดง', serving: '1 จาน', calories: 520, protein: 25, carbs: 70, fat: 15 },
  { id: 'som_tam', name: 'ส้มตำ', serving: '1 จาน', calories: 150, protein: 5, carbs: 28, fat: 3 },
  { id: 'pad_thai', name: 'ผัดไทย', serving: '1 จาน', calories: 550, protein: 18, carbs: 75, fat: 20 },
  { id: 'tom_yum_goong', name: 'ต้มยำกุ้ง', serving: '1 ถ้วย', calories: 180, protein: 20, carbs: 10, fat: 7 },
  { id: 'green_curry', name: 'แกงเขียวหวานไก่', serving: '1 ถ้วย', calories: 320, protein: 18, carbs: 14, fat: 22 },
  { id: 'massaman', name: 'แกงมัสมั่น', serving: '1 ถ้วย', calories: 420, protein: 20, carbs: 22, fat: 28 },
  { id: 'khao_soi', name: 'ข้าวซอยไก่', serving: '1 ชาม', calories: 600, protein: 26, carbs: 60, fat: 30 },
  { id: 'boat_noodle', name: 'ก๋วยเตี๋ยวเรือ', serving: '1 ชาม', calories: 350, protein: 20, carbs: 40, fat: 12 },
  { id: 'kuay_teow_nam', name: 'ก๋วยเตี๋ยวน้ำ', serving: '1 ชาม', calories: 300, protein: 15, carbs: 45, fat: 7 },
  { id: 'pad_see_ew', name: 'ผัดซีอิ๊ว', serving: '1 จาน', calories: 520, protein: 18, carbs: 68, fat: 20 },
  { id: 'kai_jeow', name: 'ไข่เจียว', serving: '1 ฟอง', calories: 170, protein: 9, carbs: 2, fat: 14 },
  { id: 'kai_dao', name: 'ไข่ดาว', serving: '1 ฟอง', calories: 110, protein: 7, carbs: 1, fat: 9 },
  { id: 'moo_ping', name: 'หมูปิ้ง', serving: '1 ไม้', calories: 90, protein: 7, carbs: 4, fat: 5 },
  { id: 'gai_yang', name: 'ไก่ย่าง', serving: '1 ชิ้น', calories: 200, protein: 25, carbs: 2, fat: 11 },
  { id: 'larb_moo', name: 'ลาบหมู', serving: '1 จาน', calories: 280, protein: 22, carbs: 10, fat: 18 },
  { id: 'khao_pad', name: 'ข้าวผัด', serving: '1 จาน', calories: 480, protein: 15, carbs: 65, fat: 18 },
  { id: 'tom_kha_gai', name: 'ต้มข่าไก่', serving: '1 ถ้วย', calories: 280, protein: 16, carbs: 10, fat: 20 },
  { id: 'papaya', name: 'มะละกอ', serving: '1 ถ้วย', calories: 60, protein: 1, carbs: 15, fat: 0 },
  { id: 'banana', name: 'กล้วยหอม', serving: '1 ผล', calories: 90, protein: 1, carbs: 23, fat: 0 },
  { id: 'mango_sticky', name: 'ข้าวเหนียวมะม่วง', serving: '1 จาน', calories: 420, protein: 6, carbs: 80, fat: 10 },
  { id: 'cha_yen', name: 'ชาเย็น', serving: '1 แก้ว', calories: 230, protein: 3, carbs: 40, fat: 6 },
  { id: 'kafae_yen', name: 'กาแฟเย็น', serving: '1 แก้ว', calories: 200, protein: 3, carbs: 32, fat: 6 },
  { id: 'nom_yen', name: 'นมเย็น', serving: '1 แก้ว', calories: 210, protein: 6, carbs: 34, fat: 6 },
  { id: 'kanom_jeen', name: 'ขนมจีนน้ำยา', serving: '1 จาน', calories: 400, protein: 14, carbs: 60, fat: 11 },
  { id: 'yam_woonsen', name: 'ยำวุ้นเส้น', serving: '1 จาน', calories: 230, protein: 14, carbs: 28, fat: 7 },
  { id: 'fried_chicken', name: 'ไก่ทอด', serving: '1 ชิ้น', calories: 260, protein: 20, carbs: 10, fat: 16 },
  { id: 'spring_roll', name: 'ปอเปี๊ยะทอด', serving: '1 ชิ้น', calories: 120, protein: 3, carbs: 12, fat: 7 },
];

export function findFood(id: string): FoodItem | undefined {
  return THAI_FOODS.find((f) => f.id === id);
}
