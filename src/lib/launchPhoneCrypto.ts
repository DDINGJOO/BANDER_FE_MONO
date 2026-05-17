const PERSONAL_DATA_PUBLIC_KEY = (
  process.env.REACT_APP_LANDING_PERSONAL_DATA_PUBLIC_KEY ??
  process.env.REACT_APP_LANDING_PHONE_PUBLIC_KEY ??
  ''
).trim();

function base64ToBytes(value: string): Uint8Array {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

export async function encryptLaunchSignupPersonalData(value: string): Promise<string> {
  if (!PERSONAL_DATA_PUBLIC_KEY) {
    throw new Error('landing personal data public key is not configured');
  }
  if (!window.crypto?.subtle) {
    throw new Error('secure browser crypto is not available');
  }

  const key = await window.crypto.subtle.importKey(
    'spki',
    base64ToBytes(PERSONAL_DATA_PUBLIC_KEY),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    new TextEncoder().encode(value)
  );

  return bytesToBase64(encrypted);
}

export function encryptLaunchSignupPhone(phone: string): Promise<string> {
  return encryptLaunchSignupPersonalData(phone);
}
