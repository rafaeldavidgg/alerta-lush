import { timingSafeEqual } from 'node:crypto';
import { Receiver } from '@upstash/qstash';

/** Header QStash sends with the request signature. */
export const QSTASH_SIGNATURE_HEADER = 'upstash-signature';

export interface SchedulerCredentials {
  cronSecret?: string;
  qstashCurrentSigningKey?: string;
  qstashNextSigningKey?: string;
}

/** Constant-time string comparison that tolerates different lengths. */
export function secretsMatch(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  if (providedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(providedBytes, expectedBytes);
}

/** Extract the token from an `Authorization: Bearer <token>` header. */
export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = /^Bearer (.+)$/.exec(authorization.trim());
  const token = match?.[1]?.trim();
  return token ? token : null;
}

/**
 * Verify a QStash request signature over the raw request body. Never throws:
 * any verification failure (missing keys, bad signature, expired claims)
 * resolves to `false`. The destination URL is intentionally not checked so
 * the same schedule keeps working across Vercel preview/production URLs.
 */
export async function verifyQstashSignature(
  signature: string,
  body: string,
  keys: Pick<SchedulerCredentials, 'qstashCurrentSigningKey' | 'qstashNextSigningKey'>,
): Promise<boolean> {
  if (!keys.qstashCurrentSigningKey) return false;
  try {
    const receiver = new Receiver({
      currentSigningKey: keys.qstashCurrentSigningKey,
      nextSigningKey: keys.qstashNextSigningKey,
    });
    await receiver.verify({ signature, body });
    return true;
  } catch {
    return false;
  }
}

/**
 * A request is authorized when it carries either a valid QStash signature or
 * a valid bearer secret. Either credential alone is sufficient.
 */
export async function isAuthorizedRequest(
  request: Request,
  rawBody: string,
  credentials: SchedulerCredentials,
): Promise<boolean> {
  const signature = request.headers.get(QSTASH_SIGNATURE_HEADER);
  if (signature && credentials.qstashCurrentSigningKey) {
    if (await verifyQstashSignature(signature, rawBody, credentials)) return true;
  }

  if (secretsMatch(extractBearerToken(request.headers.get('authorization')), credentials.cronSecret)) {
    return true;
  }

  return false;
}
