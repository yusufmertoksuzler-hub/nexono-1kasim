const turkishDays = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 
  'Perşembe', 'Cuma', 'Cumartesi'
];

const turkishMonths = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export function formatTurkishDate(date: Date): string {
  const day = date.getDate();
  const month = turkishMonths[date.getMonth()];
  const year = date.getFullYear();
  const dayName = turkishDays[date.getDay()];
  
  return `${day} ${month} ${year}, ${dayName}`;
}

export function formatShortDate(date: Date): string {
  const day = date.getDate();
  const month = turkishMonths[date.getMonth()];
  return `${day} ${month}`;
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getTodayString(): string {
  return getDateString(new Date());
}

export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}
