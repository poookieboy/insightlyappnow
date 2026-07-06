// PIN-based AES-GCM encryption for note content.
// Uses WebCrypto SubtleCrypto with PBKDF2 key derivation.
// The PIN is never stored; only the encrypted payload + a verification hash.

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function unb64(str: string): Uint8Array {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw", enc.encode(pin) as BufferSource, { name: "PBKDF2" }, false, ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Hash a PIN for verification (not for encryption). */
export async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode("insightly-notes:" + pin));
  return b64(buf);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return (await hashPin(pin)) === hash;
}

/** Returns a serialized payload: base64(salt).base64(iv).base64(ciphertext) */
export async function encryptContent(plaintext: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc.encode(plaintext) as BufferSource);
  return `${b64(salt.buffer as ArrayBuffer)}.${b64(iv.buffer as ArrayBuffer)}.${b64(ct)}`;
}

export async function decryptContent(payload: string, pin: string): Promise<string> {
  const [saltB, ivB, ctB] = payload.split(".");
  if (!saltB || !ivB || !ctB) throw new Error("Malformed payload");
  const salt = unb64(saltB);
  const iv = unb64(ivB);
  const ct = unb64(ctB);
  const key = await deriveKey(pin, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
  return dec.decode(pt);
}
