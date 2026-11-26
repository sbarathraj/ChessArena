export function generate5CharCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 5 uppercase letters & digits
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isValid5CharCode(code: string): boolean {
  return /^[A-Z0-9]{5}$/.test((code || '').trim().toUpperCase());
}
