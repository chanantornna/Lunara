/**
 * Lightweight PIN hashing using the Web Crypto SHA-256. This deters casual
 * snooping on a shared phone; it is NOT a substitute for device encryption.
 */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`lunara:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return (await hashPin(pin)) === hash;
}
