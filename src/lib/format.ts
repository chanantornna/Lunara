import { format } from 'date-fns';
import { fromISO } from './date';

const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const TH_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/** "14 ม.ค." style short Thai date from an ISO string. */
export function thShortDate(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]}`;
}

/** "มกราคม 2569" (Buddhist year) for calendar headers. */
export function thMonthYear(year: number, monthIndex: number): string {
  return `${TH_MONTHS_FULL[monthIndex]} ${year + 543}`;
}

export function hhmm(iso: string): string {
  return format(fromISO(iso), 'HH:mm');
}
