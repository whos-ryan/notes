import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const encryptedPrefix = "nv1:";
const defaultMaxJsonBytes = 512 * 1024;
const rateLimitBuckets = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

export function getClientKey(request: Request, userId?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return userId ? `user:${userId}:ip:${ipAddress}` : `ip:${ipAddress}`;
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (existing.count >= limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((existing.resetAt - now) / 1000).toString(),
        },
      },
    );
  }

  existing.count += 1;
  return null;
}

export async function readJsonBody(
  request: Request,
  maxBytes = defaultMaxJsonBytes,
) {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > maxBytes) {
    return { error: "Request body is too large.", value: null } as const;
  }

  try {
    const text = await request.text();

    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      return { error: "Request body is too large.", value: null } as const;
    }

    return {
      error: null,
      value: text ? (JSON.parse(text) as unknown) : {},
    } as const;
  } catch {
    return { error: "Invalid JSON body.", value: null } as const;
  }
}

export function clampText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

export function encryptField(value: string) {
  if (!value || value.startsWith(encryptedPrefix)) {
    return value;
  }

  const key = getEncryptionKey();

  if (!key) {
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    encryptedPrefix,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptField(value: string | null) {
  if (!value || !value.startsWith(encryptedPrefix)) {
    return value;
  }

  const key = getEncryptionKey();

  if (!key) {
    return value;
  }

  const [, ivValue, tagValue, ciphertextValue] = value.split(".");

  if (!ivValue || !tagValue || !ciphertextValue) {
    return value;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final(),
    ]);

    return plaintext.toString("utf8");
  } catch {
    return value;
  }
}

function getEncryptionKey() {
  const rawKey = process.env.NOTES_VAULT_ENCRYPTION_KEY;

  if (!rawKey) {
    return null;
  }

  return createHash("sha256").update(rawKey).digest();
}
