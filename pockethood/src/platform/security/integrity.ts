// Content integrity: SHA-256 of every downloaded file is compared with the content index,
// and the index itself can be signed (ECDSA P-256). Uses WebCrypto only (browser + Node 20).

const enc = new TextEncoder();
const subtle = () => globalThis.crypto?.subtle;

export const toBytes = (data: string | Uint8Array) => (typeof data === 'string' ? enc.encode(data) : data);

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const s = subtle();
  if (!s) throw new Error('WebCrypto unavailable: cannot verify content integrity');
  const buf = await s.digest('SHA-256', toBytes(data) as BufferSource);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const b64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

/**
 * Verify a detached ECDSA P-256 / SHA-256 signature (raw r||s, base64) over the exact bytes
 * of the content index. The public key is a JWK compiled into the client.
 */
export async function verifySignature(data: string | Uint8Array, signatureB64: string, publicKey: JsonWebKey): Promise<boolean> {
  const s = subtle();
  if (!s) return false;
  try {
    const key = await s.importKey('jwk', publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return await s.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64(signatureB64.trim()) as BufferSource, toBytes(data) as BufferSource);
  } catch {
    return false;
  }
}

/**
 * Production content-signing key. Deliberately empty in this build: no key management exists
 * yet, so signatures are not enforced (see SECURITY_ARCHITECTURE.md). When a key is issued,
 * put its public JWK here and set REQUIRE_SIGNED_CONTENT.
 */
export const CONTENT_PUBLIC_KEY: JsonWebKey | null = null;
export const REQUIRE_SIGNED_CONTENT = false;
